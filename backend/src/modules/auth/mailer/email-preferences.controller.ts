import { Controller, Get, Query, Redirect } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/env.validation';
import { EmailUnsubscribeService } from './email-unsubscribe.service';

@Controller({ path: 'email-preferences', version: '1' })
export class EmailPreferencesController {
  constructor(
    private readonly unsubscribe: EmailUnsubscribeService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('unsubscribe')
  @Redirect()
  async unsubscribeDigest(@Query('token') token: string) {
    await this.unsubscribe.unsubscribeDailyDigest(token);
    return { url: new URL('/notifications?email=unsubscribed', this.config.get('FRONTEND_URL', { infer: true })).toString() };
  }
}
