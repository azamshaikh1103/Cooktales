import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { StudioService } from './studio.service';
import { StudioAnalyticsQueryDto } from './dto/analytics-query.dto';
import { CreatePayoutMethodDto } from './dto/payout-method.dto';

@Controller({ path: 'studio', version: '1' })
@UseGuards(AuthGuard)
export class StudioController {
  constructor(private readonly studio: StudioService) {}

  @Get('dashboard')
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.studio.dashboard(request.user.sub);
  }

  @Get('analytics')
  analytics(@Req() request: AuthenticatedRequest, @Query() query: StudioAnalyticsQueryDto) {
    return this.studio.analytics(request.user.sub, query);
  }

  @Get('earnings')
  earnings(@Req() request: AuthenticatedRequest) {
    return this.studio.earnings(request.user.sub);
  }

  @Post('earnings/payout-methods')
  addPayoutMethod(@Req() request: AuthenticatedRequest, @Body() dto: CreatePayoutMethodDto) {
    return this.studio.addPayoutMethod(request.user.sub, dto);
  }

  @Patch('earnings/payout-methods/:id/primary')
  setPrimaryPayoutMethod(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.studio.setPrimaryPayoutMethod(request.user.sub, id);
  }
}
