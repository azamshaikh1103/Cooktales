import { Body, Controller, ForbiddenException, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class GoogleTokenDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  idToken!: string;
}

class MobileRefreshDto {
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  refreshToken!: string;
}

@Controller({ path: 'auth/mobile', version: '1' })
export class MobileAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('google')
  @HttpCode(200)
  google(@Body() dto: GoogleTokenDto, @Req() request: Request) {
    this.requireNativeRequest(request);
    return this.auth.mobileGoogleSignIn(dto.idToken, this.meta(request));
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: MobileRefreshDto, @Req() request: Request) {
    this.requireNativeRequest(request);
    return this.auth.refresh(dto.refreshToken, this.meta(request));
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() dto: MobileRefreshDto, @Req() request: Request) {
    this.requireNativeRequest(request);
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  private requireNativeRequest(request: Request) {
    if (request.headers.origin) throw new ForbiddenException();
  }

  private meta(request: Request) {
    return {
      ipAddress: request.headers['x-cooktale-client-ip']?.toString() || request.ip,
      userAgent: request.headers['user-agent'],
    };
  }
}
