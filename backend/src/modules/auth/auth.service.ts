import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, UserRole } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import {
  ForgotPasswordDto,
  LoginDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { AuthMailerService } from './mailer/auth-mailer.service';
import { EmailQueueService } from './mailer/email-queue.service';
import { AuthRateLimitService } from './security/auth-rate-limit.service';
import { TurnstileService } from './security/turnstile.service';

type RequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly mailer: AuthMailerService,
    private readonly emailQueue: EmailQueueService,
    private readonly redis: RedisService,
    private readonly rateLimit: AuthRateLimitService,
    private readonly turnstile: TurnstileService,
  ) {}

  async signup(dto: SignupDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase().trim();
    await this.rateLimit.checkSignup(email, meta);
    await this.verifyTurnstile(dto.turnstileToken, meta.ipAddress);

    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (!existingUser.emailVerified && !existingUser.deletedAt) {
        await this.sendVerificationEmail(email);
        return {
          success: true,
          message: 'A verification link has been sent if this account needs one.',
          user: this.serializeUser(existingUser),
        };
      }

      throw new ConflictException('An account already exists for this email');
    }

    const password = await hash(dto.password, 12);
    const username = await this.generateUniqueUsername(dto.name || email.split('@')[0]);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        username,
        password,
        role: UserRole.USER,
        status: AccountStatus.ACTIVE,
      },
    });

    await this.sendVerificationEmail(email);

    return {
      success: true,
      message: 'Account created. Please verify your email.',
      user: this.serializeUser(user),
    };
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase().trim();
    await this.rateLimit.checkLoginStart(email, meta);
    await this.verifyTurnstile(dto.turnstileToken, meta.ipAddress);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      await this.rateLimit.recordFailedLogin(email, meta);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== AccountStatus.ACTIVE || user.deletedAt) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.rateLimit.recordFailedLogin(email, meta);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.rateLimit.clearFailedLogin(email);

    if (!user.emailVerified) {
      await this.sendVerificationEmail(email);
      throw new UnauthorizedException('Email verification required');
    }

    return this.createAuthResponse(user, meta);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    const tokenHash = await this.hashToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async refresh(refreshToken: string | undefined, meta: RequestMeta) {
    await this.rateLimit.checkRefresh(refreshToken, meta);

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokenHash = await this.hashToken(refreshToken);
    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || session.user.status !== AccountStatus.ACTIVE || session.user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.createAuthResponse(session.user, meta);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.status !== AccountStatus.ACTIVE || user.deletedAt) {
      throw new UnauthorizedException('User is not active');
    }

    return { user: this.serializeUser(user) };
  }

  async verifyEmail(dto: VerifyEmailDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase().trim();
    const code = dto.code.trim();
    await this.rateLimit.checkVerifyEmail(email, meta);
    const redis = this.redis.getClient();
    const key = this.getVerificationCodeKey(email);
    const rawRecord = await redis.get(key);

    if (!rawRecord) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const record = JSON.parse(rawRecord) as { codeHash: string; attempts: number };
    const maxAttempts = this.config.get('EMAIL_VERIFICATION_MAX_ATTEMPTS', { infer: true });

    if (record.attempts >= maxAttempts) {
      await redis.del(key);
      throw new BadRequestException('Too many verification attempts');
    }

    if (!this.isCodeMatch(email, code, record.codeHash)) {
      record.attempts += 1;
      await redis.set(key, JSON.stringify(record), 'KEEPTTL');
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
    ]);
    await redis.del(key);
    await this.rateLimit.clearVerifyEmail(email);

    return { success: true };
  }

  async resendVerification(dto: ResendVerificationDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase().trim();
    await this.rateLimit.checkResendVerification(email, meta);
    await this.verifyTurnstile(dto.turnstileToken, meta.ipAddress);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt || user.emailVerified) {
      return {
        success: true,
        message: 'A verification link has been sent if this account needs one.',
      };
    }

    await this.sendVerificationEmail(email);

    return {
      success: true,
      message: 'Verification link sent.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase().trim();
    await this.rateLimit.checkForgotPassword(email, meta);
    await this.verifyTurnstile(dto.turnstileToken, meta.ipAddress);

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password || user.deletedAt) {
      return { success: true };
    }

    const token = randomBytes(32).toString('hex');
    const ttlSeconds = this.config.get('PASSWORD_RESET_TOKEN_TTL_SECONDS', { infer: true });
    await this.redis
      .getClient()
      .set(
        this.getPasswordResetKey(email),
        this.hashPasswordResetToken(email, token),
        'EX',
        ttlSeconds,
      );

    const resetUrl = `${this.config.get('FRONTEND_URL', { infer: true })}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    await this.emailQueue.enqueue(this.mailer.buildPasswordResetEmail(email, resetUrl));

    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto, meta: RequestMeta) {
    const email = dto.email.toLowerCase().trim();
    await this.rateLimit.checkResetPassword(email, dto.token, meta);
    const redis = this.redis.getClient();
    const key = this.getPasswordResetKey(email);
    const tokenHash = await redis.get(key);

    if (!tokenHash || !this.isPasswordResetTokenMatch(email, dto.token, tokenHash)) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const password = await hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { email }, data: { password } }),
      this.prisma.authSession.updateMany({
        where: { user: { email }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await redis.del(key);

    return { success: true };
  }

  async getGoogleAuthUrl(meta: RequestMeta, state: string) {
    await this.rateLimit.checkGoogle(meta);

    const clientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    const redirectUri = this.config.get('GOOGLE_OAUTH_REDIRECT_URL', { infer: true });

    if (!clientId || !redirectUri) {
      throw new ServiceUnavailableException('Google OAuth is not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }

  async handleGoogleCallback(code: string | undefined, meta: RequestMeta) {
    await this.rateLimit.checkGoogle(meta);
    if (!code) throw new BadRequestException('Missing Google OAuth code');

    const clientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET', { infer: true });
    const redirectUri = this.config.get('GOOGLE_OAUTH_REDIRECT_URL', { infer: true });

    if (!clientId || !clientSecret || !redirectUri) {
      throw new ServiceUnavailableException('Google OAuth is not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Google OAuth token exchange failed');
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new UnauthorizedException('Google profile fetch failed');
    }

    const profile = (await profileResponse.json()) as {
      sub: string;
      email: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    };

    if (!profile.email || !profile.email_verified) {
      throw new UnauthorizedException('Google account email must be verified');
    }

    const email = profile.email.toLowerCase().trim();
    const account = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: 'google', providerAccountId: profile.sub } },
      include: { user: true },
    });

    if (account) return this.createAuthResponse(account.user, meta);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        image: profile.picture,
        emailVerified: profile.email_verified ? new Date() : undefined,
      },
      create: {
        email,
        name: profile.name || email.split('@')[0],
        username: await this.generateUniqueUsername(profile.name || email.split('@')[0]),
        image: profile.picture,
        emailVerified: profile.email_verified ? new Date() : null,
      },
    });

    await this.prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: profile.sub,
      },
    });

    return this.createAuthResponse(user, meta);
  }

  private async createAuthResponse(
    user: {
      id: string;
      email: string;
      name: string;
      username: string | null;
      image: string | null;
      role: UserRole;
      isPro: boolean;
      surveyCompleted: boolean;
    },
    meta: RequestMeta,
  ) {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true }) * 24 * 60 * 60 * 1000,
    );

    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: await this.hashToken(refreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: {
    id: string;
    email: string;
    name: string;
    username: string | null;
    image: string | null;
    role: UserRole;
    isPro: boolean;
    surveyCompleted: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      image: user.image,
      role: user.role,
      isPro: user.isPro,
      surveyCompleted: user.surveyCompleted,
    };
  }

  private async verifyTurnstile(token: string | undefined, ipAddress?: string) {
    const isValid = await this.turnstile.verify(token, ipAddress);
    if (!isValid) {
      throw new BadRequestException('Security check failed');
    }
  }

  private async sendVerificationEmail(email: string) {
    const code = randomInt(100000, 1000000).toString();
    const ttlSeconds = this.config.get('EMAIL_VERIFICATION_CODE_TTL_SECONDS', { infer: true });

    await this.redis.getClient().set(
      this.getVerificationCodeKey(email),
      JSON.stringify({
        codeHash: this.hashVerificationCode(email, code),
        attempts: 0,
      }),
      'EX',
      ttlSeconds,
    );

    await this.rateLimit.clearVerifyEmail(email);
    await this.emailQueue.enqueue(this.mailer.buildVerificationCodeEmail(email, code));
  }

  private getVerificationCodeKey(email: string) {
    return `auth:email-verification:${email}`;
  }

  private getPasswordResetKey(email: string) {
    return `auth:password-reset:${email}`;
  }

  private hashVerificationCode(email: string, code: string) {
    const secret =
      this.config.get('JWT_REFRESH_SECRET', { infer: true }) || 'local-verification-secret';
    return createHash('sha256').update(`${email}:${code}:${secret}`).digest('hex');
  }

  private isCodeMatch(email: string, code: string, codeHash: string) {
    const inputHash = this.hashVerificationCode(email, code);
    const expected = Buffer.from(codeHash, 'hex');
    const actual = Buffer.from(inputHash, 'hex');

    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }

  private hashPasswordResetToken(email: string, token: string) {
    const secret = this.config.get('JWT_REFRESH_SECRET', { infer: true }) || 'local-reset-secret';
    return createHash('sha256').update(`${email}:${token}:${secret}`).digest('hex');
  }

  private isPasswordResetTokenMatch(email: string, token: string, tokenHash: string) {
    const inputHash = this.hashPasswordResetToken(email, token);
    const expected = Buffer.from(tokenHash, 'hex');
    const actual = Buffer.from(inputHash, 'hex');

    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }

  private async generateUniqueUsername(seed: string) {
    const base = seed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 18);

    for (let index = 0; index < 10; index += 1) {
      const username =
        index === 0 ? base || `chef_${randomUUID().slice(0, 8)}` : `${base}_${index}`;
      const existingUser = await this.prisma.user.findUnique({ where: { username } });
      if (!existingUser) return username;
    }

    return `chef_${randomUUID().slice(0, 8)}`;
  }

  private async hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
