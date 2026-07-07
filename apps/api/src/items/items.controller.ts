import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  Category,
  ClothingItem,
  ExtractionLabel,
  ExtractionResult,
} from 'shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { PublicUser } from 'shared-types';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { UploadService } from '../upload/upload.service';
import { ItemsService, PaginatedItems } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ListItemsDto } from './dto/list-items.dto';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DATA_BYTES = 12 * 1024 * 1024; // decoded data-URL cutouts
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/** Category pre-selected in the UI for each extraction label. */
const CATEGORY_FOR_LABEL: Record<ExtractionLabel, Category> = {
  upper: 'TOP',
  lower: 'BOTTOM',
  full: 'DRESS',
  item: 'TOP',
};

/** Multer options shared by the upload and extract endpoints. */
const IMAGE_UPLOAD_OPTIONS = {
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      cb(new BadRequestException('Only JPG, PNG or WebP images are allowed'), false);
    } else {
      cb(null, true);
    }
  },
};

/** Decodes a `data:image/png;base64,...` URL, enforcing a size cap. */
function decodeImageData(imageData: string): Buffer {
  const match = /^data:image\/(png|jpeg|webp);base64,(.+)$/.exec(imageData);
  if (!match) throw new BadRequestException('imageData must be a base64 image data URL');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_DATA_BYTES) {
    throw new BadRequestException('imageData is empty or too large');
  }
  return buffer;
}

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(
    private readonly items: ItemsService,
    private readonly imageProcessing: ImageProcessingService,
    private readonly upload: UploadService,
  ) {}

  /**
   * Create an item from either:
   *  - a photo upload → resize → garment extraction / bg removal → store, or
   *  - `imageData` (an approved cutout from /items/extract) → normalize → store.
   */
  @Post()
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async create(
    @CurrentUser() user: PublicUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateItemDto,
  ): Promise<ClothingItem> {
    let processed: Buffer;
    if (dto.imageData) {
      processed = await this.imageProcessing.normalizeCutout(decodeImageData(dto.imageData));
    } else if (file) {
      processed = await this.imageProcessing.process(file.buffer, dto.category);
    } else {
      throw new BadRequestException('An image file or imageData is required');
    }

    const { url } = await this.upload.uploadBuffer(processed, 'wardrobe/items');
    // Thumbnail is a Cloudinary transform of the same asset.
    const thumbUrl = url.replace('/upload/', '/upload/w_200,c_fill,f_webp/');

    return this.items.create(user.id, dto, url, thumbUrl);
  }

  /**
   * Preview endpoint for the upload flow: runs garment extraction and returns every
   * candidate cutout (person removed / background removed) without saving anything.
   * The client lets the user pick, refine and then POSTs the approved cutouts back.
   */
  @Post('extract')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async extract(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ExtractionResult> {
    if (!file) throw new BadRequestException('An image file is required');

    const resized = await this.imageProcessing.resize(file.buffer);
    const result = await this.imageProcessing.tryExtract(resized);

    if (result && result.candidates.length > 0) {
      return {
        mode: result.mode,
        candidates: result.candidates.map((c) => ({
          label: c.label,
          suggestedCategory: CATEGORY_FOR_LABEL[c.label],
          confidence: c.confidence,
          imageData: `data:image/png;base64,${c.buffer.toString('base64')}`,
          bbox: c.bbox,
          width: c.width,
          height: c.height,
        })),
      };
    }

    // Extraction service down — fall back to plain removal so the flow still works.
    const fallback = await this.imageProcessing.fallbackRemove(resized);
    const meta = await this.imageProcessing.metadata(fallback);
    return {
      mode: 'product',
      candidates: [
        {
          label: 'item',
          suggestedCategory: 'TOP',
          confidence: 0.4,
          imageData: `data:image/png;base64,${fallback.toString('base64')}`,
          bbox: { x: 0, y: 0, width: meta.width, height: meta.height },
          width: meta.width,
          height: meta.height,
        },
      ],
    };
  }

  @Get()
  findAll(
    @CurrentUser() user: PublicUser,
    @Query() query: ListItemsDto,
  ): Promise<PaginatedItems> {
    return this.items.findAll(user.id, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<ClothingItem> {
    return this.items.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
  ): Promise<ClothingItem> {
    return this.items.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<{ success: true }> {
    return this.items.remove(user.id, id);
  }
}
