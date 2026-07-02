import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import sharp from 'sharp';

/**
 * Turns a raw uploaded photo into a clean, background-removed PNG buffer.
 *
 * Pipeline:
 *   1. sharp: downscale to max 800px (keep aspect) and normalize orientation.
 *   2. rembg microservice: remove the background → transparent PNG.
 *   3. If rembg is unreachable and a remove.bg key is configured, fall back to it.
 *   4. If both fail, return the resized image as PNG (no bg removal) so uploads never hard-fail.
 */
@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  constructor(private readonly config: ConfigService) {}

  async process(input: Buffer): Promise<Buffer> {
    // Step 1 — resize + auto-rotate. Kept modest to bound rembg/CDN costs.
    const resized = await sharp(input)
      .rotate()
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    // Step 2 — try the local rembg service.
    const viaRembg = await this.tryRembg(resized);
    if (viaRembg) return viaRembg;

    // Step 3 — optional remove.bg fallback.
    const viaRemoveBg = await this.tryRemoveBg(resized);
    if (viaRemoveBg) return viaRemoveBg;

    // Step 4 — last resort: return the resized image untouched.
    this.logger.warn('Background removal unavailable; storing image without removal.');
    return resized;
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
