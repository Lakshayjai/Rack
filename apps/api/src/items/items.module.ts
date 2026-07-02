import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ImageProcessingModule } from '../image-processing/image-processing.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [ImageProcessingModule, UploadModule],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
