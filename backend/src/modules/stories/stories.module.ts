import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StoryAbuseService } from './story-abuse.service';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [AuthModule, MediaModule, NotificationsModule],
  controllers: [StoriesController],
  providers: [StoriesService, StoryAbuseService],
  exports: [StoriesService],
})
export class StoriesModule {}
