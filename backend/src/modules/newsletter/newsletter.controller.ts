import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Redirect, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AppConfig } from '../../config/env.validation';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import { SubscribeNewsletterDto } from './dto/newsletter.dto';
import { NewsletterService } from './newsletter.service';

@Controller({ path: 'newsletter/subscriptions', version: '1' })
export class NewsletterController {
  constructor(
    private readonly newsletter: NewsletterService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(CsrfOriginGuard)
  subscribe(@Body() dto: SubscribeNewsletterDto, @Req() request: Request) {
    return this.newsletter.subscribe(dto, request);
  }

  @Get('unsubscribe')
  @Redirect()
  async unsubscribe(@Query('token') token: string) {
    await this.newsletter.unsubscribe(token);
    return { url: new URL('/?newsletter=unsubscribed', this.config.get('FRONTEND_URL', { infer: true })).toString() };
  }
}
