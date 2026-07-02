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
import type { ClothingItem } from 'shared-types';
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
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(
    private readonly items: ItemsService,
    private readonly imageProcessing: ImageProcessingService,
    private readonly upload: UploadService,
  ) {}

  /** Upload a photo → resize → remove background → store on Cloudinary → create item. */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          cb(new BadRequestException('Only JPG, PNG or WebP images are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async create(
    @CurrentUser() user: PublicUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateItemDto,
  ): Promise<ClothingItem> {
    if (!file) throw new BadRequestException('An image file is required');

    const processed = await this.imageProcessing.process(file.buffer);
    const { url } = await this.upload.uploadBuffer(processed, 'wardrobe/items');
    // Thumbnail is a Cloudinary transform of the same asset.
    const thumbUrl = url.replace('/upload/', '/upload/w_200,c_fill,f_webp/');

    return this.items.create(user.id, dto, url, thumbUrl);
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
