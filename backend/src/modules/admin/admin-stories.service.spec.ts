import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { AdminStoriesService } from './admin-stories.service';

describe('AdminStoriesService', () => {
  it('hides a published story and records the required reason', async () => {
    const tx = {
      story: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'story-1', status: 'ARCHIVED' }),
      },
      adminStoryModerationAction: { create: jest.fn().mockResolvedValue({ id: 'action-1' }) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminStoriesService(prisma);

    await expect(
      service.hide('admin-1', 'story-1', { reason: 'Copyright concern' }),
    ).resolves.toEqual({ story: { id: 'story-1', status: 'ARCHIVED' } });

    expect(tx.story.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'story-1', status: 'PUBLISHED', deletedAt: null }),
    }));
    expect(tx.adminStoryModerationAction.create).toHaveBeenCalledWith({
      data: { storyId: 'story-1', adminId: 'admin-1', action: 'HIDDEN', reason: 'Copyright concern' },
    });
  });

  it('refuses to restore a story that was not hidden by an administrator', async () => {
    const tx = {
      adminStoryModerationAction: {
        findFirst: jest.fn().mockResolvedValue({ action: 'RESTORED' }),
        create: jest.fn(),
      },
      story: { updateMany: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminStoriesService(prisma);

    await expect(service.restore('admin-1', 'story-1')).rejects.toBeInstanceOf(ConflictException);
    expect(tx.story.updateMany).not.toHaveBeenCalled();
  });

  it('restores a story hidden by an administrator and records the restoration', async () => {
    const tx = {
      adminStoryModerationAction: {
        findFirst: jest.fn().mockResolvedValue({ action: 'HIDDEN' }),
        create: jest.fn().mockResolvedValue({ id: 'action-2' }),
      },
      story: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'story-1', status: 'PUBLISHED' }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminStoriesService(prisma);

    await expect(service.restore('admin-1', 'story-1')).resolves.toEqual({ story: { id: 'story-1', status: 'PUBLISHED' } });

    expect(tx.story.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'story-1', status: 'ARCHIVED', deletedAt: null }),
    }));
    expect(tx.adminStoryModerationAction.create).toHaveBeenCalledWith({
      data: { storyId: 'story-1', adminId: 'admin-1', action: 'RESTORED' },
    });
  });
});
