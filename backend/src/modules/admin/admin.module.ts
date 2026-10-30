import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminOperationsService } from './admin-operations.service';
import { AdminRecipesService } from './admin-recipes.service';
import { AdminStoriesService } from './admin-stories.service';
import { AdminUsersService } from './admin-users.service';
import { AdminGuard } from './security/admin.guard';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminAnalyticsService, AdminOperationsService, AdminRecipesService, AdminStoriesService, AdminUsersService, AdminGuard],
})
export class AdminModule {}
