import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PointsModule } from '../points/points.module';
import { StoryAbuseService } from './story-abuse.service';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [AuthModule, MediaModule, NotificationsModule, PointsModule],
  controllers: [StoriesController],
  providers: [StoriesService, StoryAbuseService],
  exports: [StoriesService],
})
export class StoriesModule {}
