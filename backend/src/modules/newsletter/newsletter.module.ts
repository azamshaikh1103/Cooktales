import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NewsletterController } from './newsletter.controller';
import { NewsletterRateLimitService } from './newsletter-rate-limit.service';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [AuthModule],
  controllers: [NewsletterController],
  providers: [NewsletterService, NewsletterRateLimitService],
})
export class NewsletterModule {}
