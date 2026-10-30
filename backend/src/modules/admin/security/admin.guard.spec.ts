import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function contextFor(role: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows an administrator', () => {
    expect(guard.canActivate(contextFor('ADMIN'))).toBe(true);
  });

  it('rejects a non-administrator', () => {
    expect(() => guard.canActivate(contextFor('USER'))).toThrow(ForbiddenException);
  });
});
