import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationCleanupService } from './notification-cleanup.service';
import { NotificationDigestService } from './notification-digest.service';
import { NotificationPushService } from './notification-push.service';
import { NotificationRealtimeService } from './notification-realtime.service';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationCleanupService,
    NotificationDigestService,
    NotificationPushService,
    NotificationRealtimeService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
