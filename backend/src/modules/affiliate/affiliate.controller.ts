import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import type { AppConfig } from '../../config/env.validation';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-request';
import { AffiliateService } from './affiliate.service';
import { RecordAffiliateClickDto } from './dto/affiliate-click.dto';

@Controller({ path: 'affiliate', version: '1' })
@UseGuards(CsrfOriginGuard)
export class AffiliateController {
  constructor(
    private readonly affiliate: AffiliateService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Public: anyone can click a link. A signed-in visitor is recognised from their token when valid. */
  @Post('clicks')
  @HttpCode(HttpStatus.OK)
  async record(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RecordAffiliateClickDto,
    @Headers('authorization') authorization?: string,
    @Headers('cf-ipcountry') country?: string,
  ) {
    return this.affiliate.record(dto, {
      userId: await this.optionalUserId(authorization),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      country: country?.toUpperCase(),
    });
  }

  private async optionalUserId(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) return null;
    try {
      const user = await this.jwt.verifyAsync<AuthenticatedUser>(authorization.slice('Bearer '.length), {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
      return user.sub;
    } catch {
      return null;
    }
  }
}
