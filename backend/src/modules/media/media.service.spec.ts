import { PendingMediaStatus } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { MediaService } from './media.service';

describe('MediaService.scheduleThreadMediaDeletion', () => {
  const build = () => {
    const prisma = { pendingMediaUpload: { updateMany: jest.fn().mockResolvedValue({ count: 3 }) } };
    const config = { get: jest.fn((key: string) => (key === 'CLOUDINARY_ROOT_FOLDER' ? 'cooktale' : undefined)) };
    const service = new MediaService(config as never, prisma as unknown as PrismaService);
    return { service, prisma };
  };

  it('queues only that thread\'s files, due after the grace period', async () => {
    const { service, prisma } = build();
    const before = Date.now();

    await expect(service.scheduleThreadMediaDeletion('thread-1', 30)).resolves.toBe(3);

    const call = prisma.pendingMediaUpload.updateMany.mock.calls[0][0];
    expect(call.where.publicId).toEqual({ startsWith: 'cooktale/community/threads/thread-1/' });
    expect(call.where.status.in).toEqual(
      expect.arrayContaining([PendingMediaStatus.ATTACHED, PendingMediaStatus.UPLOADED, PendingMediaStatus.PENDING]),
    );
    expect(call.data.status).toBe(PendingMediaStatus.DELETE_PENDING);
    const days = (call.data.expiresAt.getTime() - before) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(29.99);
    expect(days).toBeLessThan(30.01);
  });

  it('is due immediately with no grace period', async () => {
    const { service, prisma } = build();

    await service.scheduleThreadMediaDeletion('thread-2', 0);

    const { expiresAt } = prisma.pendingMediaUpload.updateMany.mock.calls[0][0].data;
    expect(expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
