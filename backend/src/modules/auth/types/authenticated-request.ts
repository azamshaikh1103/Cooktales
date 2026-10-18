import type { Request } from 'express';

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
  cookies?: Record<string, string>;
};
