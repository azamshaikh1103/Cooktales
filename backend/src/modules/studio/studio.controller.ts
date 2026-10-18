import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { StudioService } from './studio.service';

@Controller({ path: 'studio', version: '1' })
@UseGuards(AuthGuard)
export class StudioController {
  constructor(private readonly studio: StudioService) {}

  @Get('dashboard')
  dashboard(@Req() request: AuthenticatedRequest) {
    return this.studio.dashboard(request.user.sub);
  }

  @Get('analytics')
  analytics(@Req() request: AuthenticatedRequest) {
    return this.studio.analytics(request.user.sub);
  }
}
