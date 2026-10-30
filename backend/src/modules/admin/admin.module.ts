import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminOperationsService } from './admin-operations.service';
import { AdminRecipesService } from './admin-recipes.service';
import { AdminGuard } from './security/admin.guard';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminAnalyticsService, AdminOperationsService, AdminRecipesService, AdminGuard],
})
export class AdminModule {}
