import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { AppConfig } from '../src/config/env.validation';
import { AuthController } from '../src/modules/auth/auth.controller';
import {
  createRefreshCookieClearOptions,
  createRefreshCookieOptions,
  REFRESH_COOKIE_PATH,
  removeRefreshTokenFromResponse,
} from '../src/modules/auth/auth-http';
import { AuthService } from '../src/modules/auth/auth.service';

function createController(authServiceOverrides: Partial<AuthService> = {}) {
  const authService = {
    login: jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1' },
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    ...authServiceOverrides,
  } as unknown as AuthService;
  const config = {
    get(key: keyof AppConfig) {
      if (key === 'NODE_ENV') return 'production';
      if (key === 'JWT_REFRESH_TTL_DAYS') return 30;
      if (key === 'FRONTEND_URL') return 'https://www.cooktale.example';
      throw new Error(`Unexpected config key: ${key}`);
    },
  } as ConfigService<AppConfig, true>;

  return { controller: new AuthController(authService, config), authService };
}

describe('Auth HTTP safety', () => {
  it('creates a secure 30-day HTTP-only refresh cookie', () => {
    const options = createRefreshCookieOptions({ secure: true, ttlDays: 30 });

    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      priority: 'high',
    });
  });

  it('uses matching identity settings when clearing the cookie', () => {
    const created = createRefreshCookieOptions({ secure: true, ttlDays: 30 });
    const cleared = createRefreshCookieClearOptions({ secure: true });

    expect(cleared).toMatchObject({
      httpOnly: created.httpOnly,
      secure: created.secure,
      sameSite: created.sameSite,
      path: created.path,
      priority: created.priority,
    });
    expect(cleared.maxAge).toBeUndefined();
  });

  it('removes refresh tokens from browser-visible responses', () => {
    const response = removeRefreshTokenFromResponse({
      accessToken: 'short-lived-access-token',
      refreshToken: 'private-refresh-token',
      user: { id: 'user-1' },
    });

    expect(response).toEqual({
      accessToken: 'short-lived-access-token',
      user: { id: 'user-1' },
    });
    expect(response).not.toHaveProperty('refreshToken');
  });

  it('puts the login refresh token only in the cookie', async () => {
    const { controller } = createController();
    const response = {
      cookie: jest.fn(),
    } as unknown as Response;

    const body = await controller.login(
      { email: 'user@example.com', password: 'Password1' },
      { headers: {}, cookies: {}, ip: '127.0.0.1' } as unknown as Request,
      response,
    );

    expect(body).not.toHaveProperty('refreshToken');
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, secure: true }),
    );
  });

  it('revokes and clears the cookie token on logout', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    const { controller } = createController({ logout } as Partial<AuthService>);
    const response = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    await controller.logout(
      {},
      {
        headers: {},
        cookies: { refreshToken: 'cookie-token' },
        ip: '127.0.0.1',
      } as unknown as Request,
      response,
    );

    expect(logout).toHaveBeenCalledWith('cookie-token');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ path: REFRESH_COOKIE_PATH, secure: true }),
    );
  });

  it('returns Google sign-ins to the frontend without exposing tokens in the URL', async () => {
    const handleGoogleCallback = jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1' },
    });
    const { controller } = createController({ handleGoogleCallback } as Partial<AuthService>);
    const response = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response;

    await controller.googleCallback(
      'google-code',
      { headers: {}, cookies: {}, ip: '127.0.0.1' } as unknown as Request,
      response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, secure: true }),
    );
    expect(response.redirect).toHaveBeenCalledWith(
      'https://www.cooktale.example/auth/google/callback',
    );
  });
});
