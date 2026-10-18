import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

type RefreshCookieConfig = {
  secure: boolean;
  ttlDays: number;
};

export function createRefreshCookieOptions(config: RefreshCookieConfig): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secure,
    path: REFRESH_COOKIE_PATH,
    maxAge: config.ttlDays * 24 * 60 * 60 * 1000,
    priority: 'high',
  };
}

export function createRefreshCookieClearOptions(
  config: Pick<RefreshCookieConfig, 'secure'>,
): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.secure,
    path: REFRESH_COOKIE_PATH,
    priority: 'high',
  };
}

export function removeRefreshTokenFromResponse<T extends { refreshToken: string }>(
  result: T,
): Omit<T, 'refreshToken'> {
  const publicResult: Partial<T> = { ...result };
  delete publicResult.refreshToken;
  return publicResult as Omit<T, 'refreshToken'>;
}
