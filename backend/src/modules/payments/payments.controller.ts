import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateCheckoutDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@Controller({ path: 'payments', version: '1' })
@UseGuards(AuthGuard, CsrfOriginGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  createCheckout(@Req() request: AuthenticatedRequest, @Body() dto: CreateCheckoutDto) {
    return this.payments.createCheckout(request.user.sub, dto.plan);
  }

  @Get('billing-portal')
  billingPortal(@Req() request: AuthenticatedRequest) {
    return this.payments.getBillingPortal(request.user.sub);
  }

  @Get('membership')
  membership(@Req() request: AuthenticatedRequest) {
    return this.payments.getMembership(request.user.sub);
  }
}

@Controller({ path: 'payments/webhooks', version: '1' })
export class PaymentsWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('lemon-squeezy')
  @HttpCode(HttpStatus.OK)
  receiveLemonSqueezy(@Req() request: Request & { rawBody?: Buffer }) {
    return this.payments.handleLemonSqueezyWebhook(request.rawBody, request.headers['x-signature']);
  }
}
