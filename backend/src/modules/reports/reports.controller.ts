import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateReportDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

@Controller({ path: 'reports', version: '1' })
@UseGuards(CsrfOriginGuard, AuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    return this.reports.create(request.user.sub, dto);
  }
}
