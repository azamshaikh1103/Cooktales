import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaController } from './media.controller';
import { MediaCleanupService } from './media-cleanup.service';
import { MediaService } from './media.service';

@Module({
  imports: [AuthModule],
  controllers: [MediaController],
  providers: [MediaService, MediaCleanupService],
  exports: [MediaService, MediaCleanupService],
})
export class MediaModule {}
