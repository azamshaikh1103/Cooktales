import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { RedisService } from '../../redis/redis.service';
import { AuthMailerService } from './mailer/auth-mailer.service';
import { EmailPreferencesController } from './mailer/email-preferences.controller';
import { EmailQueueService } from './mailer/email-queue.service';
import { EmailUnsubscribeService } from './mailer/email-unsubscribe.service';
import { AuthRateLimitService } from './security/auth-rate-limit.service';
import { CsrfOriginGuard } from './security/csrf-origin.guard';
import { TurnstileService } from './security/turnstile.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, EmailPreferencesController],
  providers: [
    AuthService,
    AuthGuard,
    AuthMailerService,
    EmailUnsubscribeService,
    EmailQueueService,
    RedisService,
    AuthRateLimitService,
    CsrfOriginGuard,
    TurnstileService,
  ],
  exports: [
    JwtModule,
    AuthGuard,
    AuthService,
    AuthMailerService,
    EmailQueueService,
    EmailUnsubscribeService,
    CsrfOriginGuard,
    RedisService,
  ],
})
export class AuthModule {}
