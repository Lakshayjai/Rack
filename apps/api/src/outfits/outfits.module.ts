import { Module } from '@nestjs/common';
import { OutfitsController } from './outfits.controller';
import { OutfitsService } from './outfits.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [OutfitsController],
  providers: [OutfitsService],
  exports: [OutfitsService],
})
export class OutfitsModule {}
