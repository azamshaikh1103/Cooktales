import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { SubmitOnboardingSurveyDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller({ path: 'onboarding', version: '1' })
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('survey')
  getSurvey(@Req() request: AuthenticatedRequest) {
    return this.onboarding.getStatus(request.user.sub);
  }

  @Post('survey')
  @HttpCode(HttpStatus.OK)
  submitSurvey(@Req() request: AuthenticatedRequest, @Body() dto: SubmitOnboardingSurveyDto) {
    return this.onboarding.submit(request.user.sub, dto);
  }

  @Post('survey/skip')
  @HttpCode(HttpStatus.OK)
  skipSurvey(@Req() request: AuthenticatedRequest) {
    return this.onboarding.skip(request.user.sub);
  }
}
