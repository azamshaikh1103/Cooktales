import {
  UnauthorizedException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { AppConfig } from '../../config/env.validation';
import { AuthGuard } from './auth.guard';
import {
  createGoogleOAuthStateCookieClearOptions,
  createGoogleOAuthStateCookieOptions,
  createRefreshCookieClearOptions,
  createRefreshCookieOptions,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  removeRefreshTokenFromResponse,
} from './auth-http';
import { AuthService } from './auth.service';
import { CsrfOriginGuard } from './security/csrf-origin.guard';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import type { AuthenticatedRequest } from './types/authenticated-request';

@Controller({
  path: 'auth',
  version: '1',
})
@UseGuards(CsrfOriginGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Post('signup')
  signup(@Body() dto: SignupDto, @Req() request: Request) {
    return this.authService.signup(dto, this.getRequestMeta(request));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto, this.getRequestMeta(request));
    this.setRefreshCookie(response, result.refreshToken);
    return removeRefreshTokenFromResponse(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(dto.refreshToken || request.cookies?.[REFRESH_COOKIE_NAME]);
    this.clearRefreshCookie(response);
    return { success: true };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      dto.refreshToken || request.cookies?.[REFRESH_COOKIE_NAME],
      this.getRequestMeta(request),
    );
    this.setRefreshCookie(response, result.refreshToken);
    return removeRefreshTokenFromResponse(result);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getCurrentUser(request.user.sub);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() request: Request) {
    return this.authService.verifyEmail(dto, this.getRequestMeta(request));
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body() dto: ResendVerificationDto, @Req() request: Request) {
    return this.authService.resendVerification(dto, this.getRequestMeta(request));
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(dto, this.getRequestMeta(request));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(dto, this.getRequestMeta(request));
  }

  @Get('google')
  googleAuthUrl(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const state = randomBytes(32).toString('base64url');
    response.cookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, state, this.getGoogleOAuthStateCookieOptions());
    return this.authService.getGoogleAuthUrl(this.getRequestMeta(request), state);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const expectedState = request.cookies?.[GOOGLE_OAUTH_STATE_COOKIE_NAME];
    this.clearGoogleOAuthStateCookie(response);

    if (!this.isGoogleOAuthStateMatch(state, expectedState)) {
      throw new UnauthorizedException('Google sign-in could not be verified');
    }

    const result = await this.authService.handleGoogleCallback(code, this.getRequestMeta(request));
    this.setRefreshCookie(response, result.refreshToken);
    return response.redirect(
      new URL(
        '/auth/google/callback',
        this.config.get('FRONTEND_URL', { infer: true }),
      ).toString(),
    );
  }

  private setRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, this.getRefreshCookieOptions());
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(
      REFRESH_COOKIE_NAME,
      createRefreshCookieClearOptions({ secure: this.isProduction() }),
    );
  }

  private clearGoogleOAuthStateCookie(response: Response) {
    response.clearCookie(
      GOOGLE_OAUTH_STATE_COOKIE_NAME,
      createGoogleOAuthStateCookieClearOptions({ secure: this.isProduction() }),
    );
  }

  private getRefreshCookieOptions() {
    return createRefreshCookieOptions({
      secure: this.isProduction(),
      ttlDays: this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true }),
    });
  }

  private getGoogleOAuthStateCookieOptions() {
    return createGoogleOAuthStateCookieOptions({ secure: this.isProduction() });
  }

  private isGoogleOAuthStateMatch(state: string | undefined, expectedState: unknown) {
    if (!state || typeof expectedState !== 'string') return false;

    const actual = Buffer.from(state);
    const expected = Buffer.from(expectedState);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private isProduction() {
    return this.config.get('NODE_ENV', { infer: true }) === 'production';
  }

  private getRequestMeta(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const ipAddress =
      request.headers['cf-connecting-ip']?.toString() ||
      request.headers['x-real-ip']?.toString() ||
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim()) ||
      request.ip;

    return {
      ipAddress,
      userAgent: request.headers['user-agent'],
    };
  }
}
