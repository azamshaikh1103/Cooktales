import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AppConfig } from '../../../config/env.validation';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext) {
    if (!this.config.get('AUTH_CSRF_PROTECTION_ENABLED', { infer: true })) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

    const requestOrigin = this.getRequestOrigin(request);
    if (!requestOrigin) {
      throw new ForbiddenException('Missing request origin');
    }

    if (!this.getAllowedOrigins().has(requestOrigin)) {
      throw new ForbiddenException('Untrusted request origin');
    }

    return true;
  }

  private getRequestOrigin(request: Request) {
    const origin = request.headers.origin;
    if (origin) return this.normalizeOrigin(origin);

    const referer = request.headers.referer;
    if (!referer) return null;

    try {
      return this.normalizeOrigin(new URL(referer).origin);
    } catch {
      return null;
    }
  }

  private getAllowedOrigins() {
    const origins = [
      this.config.get('FRONTEND_URL', { infer: true }),
      ...this.config.get('CORS_ORIGINS', { infer: true }),
      ...this.config.get('AUTH_TRUSTED_ORIGINS', { infer: true }),
    ];

    return new Set(origins.map((origin) => this.normalizeOrigin(origin)));
  }

  private normalizeOrigin(origin: string) {
    try {
      const url = new URL(origin);
      return `${url.protocol}//${url.host}`;
    } catch {
      return origin.replace(/\/$/, '');
    }
  }
}
