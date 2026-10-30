import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './security/admin.guard';
import { AdminAnalyticsService } from './admin-analytics.service';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('analytics/overview')
  overview() {
    return this.analytics.overview();
  }
}
