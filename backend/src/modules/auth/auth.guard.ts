import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccountStatus } from '@prisma/client';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedRequest, AuthenticatedUser } from './types/authenticated-request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const user = await this.jwtService.verifyAsync<AuthenticatedUser>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });

      const activeUser = await this.prisma.user.findFirst({
        where: {
          id: user.sub,
          status: AccountStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!activeUser) {
        throw new UnauthorizedException('User is not active');
      }

      request.user = user;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
