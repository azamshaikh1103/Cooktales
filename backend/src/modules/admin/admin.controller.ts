import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from './security/admin.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminOperationsService } from './admin-operations.service';

@Controller({ path: 'admin', version: '1' })
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly analytics: AdminAnalyticsService,
    private readonly operations: AdminOperationsService,
  ) {}

  @Get('analytics/overview')
  overview() {
    return this.analytics.overview();
  }

  @Get('operations')
  operationsOverview() {
    return this.operations.overview();
  }
}
