import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export interface UploadResult {
  url: string;
}

/** Absolute path to the local uploads directory (used when Cloudinary is not configured). */
export const LOCAL_UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * Storage abstraction. Uploads processed PNG buffers to Cloudinary when configured,
 * otherwise falls back to the local filesystem (served statically at /uploads) so the
 * app works out of the box without any signup.
 */
@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private cloudinaryEnabled = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const cloudName = this.config.get<string>('cloudinary.cloudName');
    const apiKey = this.config.get<string>('cloudinary.apiKey');
    const apiSecret = this.config.get<string>('cloudinary.apiSecret');

    this.cloudinaryEnabled = Boolean(
      cloudName && apiKey && apiSecret && cloudName !== 'your_cloud_name',
    );

    if (this.cloudinaryEnabled) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.logger.log('Using Cloudinary for image storage.');
    } else {
      await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
      this.logger.warn(
        'Cloudinary not configured — storing images locally in apps/api/uploads. ' +
          'Set CLOUDINARY_* in apps/api/.env to use the CDN.',
      );
    }
  }

  /** Uploads a PNG buffer and returns its public URL. */
  async uploadBuffer(buffer: Buffer, folder: string): Promise<UploadResult> {
    return this.cloudinaryEnabled
      ? this.uploadToCloudinary(buffer, folder)
      : this.uploadToDisk(buffer);
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    folder: string,
  ): Promise<UploadResult> {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', format: 'png' },
        (error, res) => {
          // Cloudinary's error object is a plain shape, not an Error instance.
          if (error || !res)
            reject(new Error(error?.message ?? 'Empty Cloudinary response'));
          else resolve(res);
        },
      );
      stream.end(buffer);
    });
    return { url: result.secure_url };
  }

  private async uploadToDisk(buffer: Buffer): Promise<UploadResult> {
    const filename = `${randomUUID()}.png`;
    await fs.writeFile(join(LOCAL_UPLOAD_DIR, filename), buffer);
    const base = this.config.get<string>('publicApiUrl');
    return { url: `${base}/uploads/${filename}` };
  }

  /** Deletes a stored asset by its URL. Best-effort; logs but never throws. */
  async deleteByUrl(url: string): Promise<void> {
    try {
      if (this.cloudinaryEnabled && url.includes('res.cloudinary.com')) {
        const publicId = this.publicIdFromUrl(url);
        if (publicId)
          await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
          });
      } else if (url.includes('/uploads/')) {
        const filename = url.split('/uploads/')[1];
        if (filename)
          await fs
            .unlink(join(LOCAL_UPLOAD_DIR, filename))
            .catch(() => undefined);
      }
    } catch (err) {
      this.logger.warn(
        `Failed to delete asset ${url}: ${(err as Error).message}`,
      );
    }
  }

  /** Extracts the Cloudinary public id from a delivery URL. */
  private publicIdFromUrl(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    return match ? match[1] : null;
  }
}
