import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  it('includes administrator accounts in the people list', async () => {
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    } as unknown as PrismaService;
    const service = new AdminUsersService(prisma, {} as never, {} as never, {} as never);

    await service.list({ page: 1, pageSize: 25 });

    const [{ where }] = (prisma.user.findMany as jest.Mock).mock.calls[0];
    expect(where.role).toBeUndefined();
  });

  it('bans an active non-admin user, revokes sessions, and records why', async () => {
    const tx = {
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'user-1', status: 'SUSPENDED' }),
      },
      authSession: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      adminUserModerationAction: { create: jest.fn().mockResolvedValue({ id: 'action-1' }) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminUsersService(prisma, {} as never, {} as never, {} as never);

    await expect(service.ban('admin-1', 'user-1', { reason: 'Repeated abusive comments' }))
      .resolves.toEqual({ user: { id: 'user-1', status: 'SUSPENDED' } });

    expect(tx.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1', revokedAt: null },
    }));
    expect(tx.adminUserModerationAction.create).toHaveBeenCalledWith({
      data: { targetUserId: 'user-1', adminId: 'admin-1', action: 'BANNED', reason: 'Repeated abusive comments' },
    });
  });

  it('refuses to ban an admin, the acting admin, or an account that is not active', async () => {
    const tx = {
      user: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      authSession: { updateMany: jest.fn() },
      adminUserModerationAction: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminUsersService(prisma, {} as never, {} as never, {} as never);

    await expect(service.ban('admin-1', 'admin-1', { reason: 'Invalid target' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(tx.authSession.updateMany).not.toHaveBeenCalled();
    expect(tx.adminUserModerationAction.create).not.toHaveBeenCalled();
  });

  it('refuses to unban an account that was not banned by an admin', async () => {
    const tx = {
      adminUserModerationAction: { findFirst: jest.fn().mockResolvedValue({ action: 'WARNING' }) },
      user: { updateMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminUsersService(prisma, {} as never, {} as never, {} as never);

    await expect(service.unban('admin-1', 'user-1', { reason: 'Appeal accepted' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it('unbans an account previously banned by an administrator and records why', async () => {
    const tx = {
      adminUserModerationAction: {
        findFirst: jest.fn().mockResolvedValue({ action: 'BANNED' }),
        create: jest.fn().mockResolvedValue({ id: 'action-2' }),
      },
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'user-1', status: 'ACTIVE' }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminUsersService(prisma, {} as never, {} as never, {} as never);

    await expect(service.unban('admin-1', 'user-1', { reason: 'Appeal accepted' }))
      .resolves.toEqual({ user: { id: 'user-1', status: 'ACTIVE' } });

    expect(tx.adminUserModerationAction.create).toHaveBeenCalledWith({
      data: { targetUserId: 'user-1', adminId: 'admin-1', action: 'UNBANNED', reason: 'Appeal accepted' },
    });
  });

  it('records a warning and queues its email for an active non-admin user', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com', name: 'User' }),
      },
      adminUserModerationAction: {
        create: jest.fn().mockResolvedValue({ id: 'action-1' }),
        update: jest.fn().mockResolvedValue({ id: 'action-1' }),
      },
    } as unknown as PrismaService;
    const notifications = { create: jest.fn().mockResolvedValue({ id: 'notification-1' }) };
    const mailer = { buildAdminModerationEmail: jest.fn().mockReturnValue({ to: 'user@example.com' }) };
    const emailQueue = { enqueue: jest.fn().mockResolvedValue(undefined) };
    const service = new AdminUsersService(prisma, notifications as never, mailer as never, emailQueue as never);

    await expect(service.warn('admin-1', 'user-1', { reason: 'Please keep comments respectful.' }))
      .resolves.toEqual({ action: { id: 'action-1' } });

    expect(emailQueue.enqueue).toHaveBeenCalledWith({ to: 'user@example.com' }, { jobId: 'admin-user-moderation:action-1' });
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: 'user-1',
      type: 'SYSTEM',
      force: true,
    }));
  });
});
