import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminGuard } from './security/admin.guard';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminAnalyticsService, AdminGuard],
})
export class AdminModule {}
