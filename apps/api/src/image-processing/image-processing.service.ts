import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import sharp from 'sharp';
import type { Category, ExtractionLabel } from 'shared-types';

/** One garment cutout proposed by the extraction service (buffer form). */
export interface RawExtractionCandidate {
  label: ExtractionLabel;
  confidence: number;
  /** Full-frame transparent PNG. */
  buffer: Buffer;
  bbox: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
}

export interface RawExtractionResult {
  mode: 'person' | 'product';
  candidates: RawExtractionCandidate[];
}

/** Shape of the JSON returned by the Python service's POST /extract. */
interface ExtractServiceResponse {
  mode: 'person' | 'product';
  candidates: {
    label: ExtractionLabel;
    confidence: number;
    png: string;
    bbox: { x: number; y: number; width: number; height: number };
    width: number;
    height: number;
  }[];
}

/** Which extraction label best matches a wardrobe category. */
const LABEL_FOR_CATEGORY: Record<Category, ExtractionLabel> = {
  TOP: 'upper',
  OUTERWEAR: 'upper',
  BOTTOM: 'lower',
  DRESS: 'full',
  SHOE: 'item',
  ACCESSORY: 'item',
};

/**
 * Turns a raw uploaded photo into a clean, background-removed garment cutout.
 *
 * Pipeline:
 *   1. sharp: downscale to max 800px (keep aspect) and normalize orientation.
 *   2. rembg /extract: cloth parsing (person removal) + whole-foreground cutout,
 *      returning per-garment candidates; pick the one matching the chosen category.
 *   3. Fallbacks when /extract is unavailable: legacy /remove, then remove.bg,
 *      then the resized image untouched (uploads never hard-fail).
 *   4. normalizeCutout: trim transparent borders, add ~4% padding, cap at 800px.
 */
@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(private readonly config: ConfigService) {}

  /** Resize + auto-rotate an upload. Kept modest to bound rembg/CDN costs. */
  async resize(input: Buffer): Promise<Buffer> {
    return sharp(input)
      .rotate()
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
  }

  /** Pixel dimensions of an image buffer. */
  async metadata(buffer: Buffer): Promise<{ width: number; height: number }> {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width ?? 0, height: meta.height ?? 0 };
  }

  /** Full pipeline for the classic single-image upload path. */
  async process(input: Buffer, categoryHint?: Category): Promise<Buffer> {
    const resized = await this.resize(input);

    const extraction = await this.tryExtract(resized);
    if (extraction && extraction.candidates.length > 0) {
      const pick = this.pickCandidate(extraction, categoryHint);
      return this.normalizeCutout(pick.buffer);
    }

    return this.fallbackRemove(resized);
  }

  /** Legacy removal chain (rembg /remove → remove.bg → untouched) for a resized image. */
  async fallbackRemove(resized: Buffer): Promise<Buffer> {
    const viaRembg = await this.tryRembg(resized);
    if (viaRembg) return this.normalizeCutout(viaRembg);

    const viaRemoveBg = await this.tryRemoveBg(resized);
    if (viaRemoveBg) return this.normalizeCutout(viaRemoveBg);

    this.logger.warn('Background removal unavailable; storing image without removal.');
    return resized;
  }

  /**
   * Runs garment extraction on an (already resized) image and returns all candidates.
   * Returns null when the service is unreachable so callers can fall back.
   */
  async tryExtract(resized: Buffer): Promise<RawExtractionResult | null> {
    const url = this.config.get<string>('rembg.extractUrl');
    if (!url) return null;
    try {
      const res = await axios.post<ExtractServiceResponse>(url, resized, {
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: 120_000,
        maxBodyLength: Infinity,
      });
      return {
        mode: res.data.mode,
        candidates: res.data.candidates.map((c) => ({
          label: c.label,
          confidence: c.confidence,
          buffer: Buffer.from(c.png, 'base64'),
          bbox: c.bbox,
          width: c.width,
          height: c.height,
        })),
      };
    } catch (err) {
      this.logger.warn(`rembg /extract failed: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Picks the extraction candidate that best matches the chosen category:
   * cloth-parsed garment for worn photos, whole-foreground cutout otherwise.
   */
  pickCandidate(
    result: RawExtractionResult,
    categoryHint?: Category,
  ): RawExtractionCandidate {
    const wanted: ExtractionLabel =
      result.mode === 'product' || !categoryHint
        ? 'item'
        : LABEL_FOR_CATEGORY[categoryHint];
    return (
      result.candidates.find((c) => c.label === wanted) ??
      result.candidates.find((c) => c.label === 'item') ??
      result.candidates[0]
    );
  }

  /**
   * Normalizes a transparent cutout: auto-crop to the garment's bounding box,
   * add ~4% transparent padding, cap the longest side at 800px.
   */
  async normalizeCutout(cutout: Buffer): Promise<Buffer> {
    try {
      const trimmed = await sharp(cutout).trim().png().toBuffer();
      const meta = await sharp(trimmed).metadata();
      const pad = Math.max(8, Math.round(Math.max(meta.width ?? 0, meta.height ?? 0) * 0.04));
      return await sharp(trimmed)
        .extend({
          top: pad,
          bottom: pad,
          left: pad,
          right: pad,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch (err) {
      // trim() throws on fully-transparent/uniform images — store the cutout as-is.
      this.logger.warn(`Cutout normalization skipped: ${(err as Error).message}`);
      return cutout;
    }
  }

  private async tryRembg(buffer: Buffer): Promise<Buffer | null> {
    const url = this.config.get<string>('rembg.url');
    if (!url) return null;
    try {
      const res = await axios.post<ArrayBuffer>(url, buffer, {
        headers: { 'Content-Type': 'application/octet-stream' },
        responseType: 'arraybuffer',
        timeout: 60_000,
        maxBodyLength: Infinity,
      });
      return Buffer.from(res.data);
    } catch (err) {
      this.logger.warn(`rembg failed: ${(err as Error).message}`);
      return null;
    }
  }

  private async tryRemoveBg(buffer: Buffer): Promise<Buffer | null> {
    const apiKey = this.config.get<string>('rembg.removeBgApiKey');
    if (!apiKey) return null;
    try {
      const form = new FormData();
      form.append('size', 'auto');
      form.append('image_file', new Blob([new Uint8Array(buffer)]), 'image.png');
      const res = await axios.post<ArrayBuffer>('https://api.remove.bg/v1.0/removebg', form, {
        headers: { 'X-Api-Key': apiKey },
        responseType: 'arraybuffer',
        timeout: 60_000,
      });
      return Buffer.from(res.data);
    } catch (err) {
      this.logger.warn(`remove.bg failed: ${(err as Error).message}`);
      return null;
    }
  }
}
