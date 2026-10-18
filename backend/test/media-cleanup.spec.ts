import type { ConfigService } from '@nestjs/config';
import { CloudinaryResourceType, PendingMediaStatus } from '@prisma/client';
import type { AppConfig } from '../src/config/env.validation';
import type { PrismaService } from '../src/database/prisma.service';
import { MediaCleanupService } from '../src/modules/media/media-cleanup.service';
import type { MediaService } from '../src/modules/media/media.service';

describe('Abandoned media cleanup', () => {
  const expiredUpload = {
    id: 'upload-1',
    userId: 'user-1',
    publicId: 'cooktale/tmp/user-1/file',
    context: 'TEMP',
    entityId: null,
    resourceType: CloudinaryResourceType.IMAGE,
    status: PendingMediaStatus.UPLOADED,
    url: 'https://res.cloudinary.com/test/image/upload/file.jpg',
    width: null,
    height: null,
    bytes: null,
    format: null,
    expiresAt: new Date(Date.now() - 1000),
    confirmedAt: new Date(),
    attachedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    pendingMediaUpload: {
      findMany: jest.fn().mockResolvedValue([expiredUpload]),
      update: jest.fn().mockResolvedValue(undefined),
    },
  } as unknown as PrismaService;
  const media = {
    deleteAsset: jest.fn().mockResolvedValue({ result: 'ok' }),
  } as unknown as MediaService;
  const config = {
    get: jest.fn((key: string) => (key === 'APP_MODE' ? 'api' : 15)),
  } as unknown as ConfigService<AppConfig, true>;

  beforeEach(() => jest.clearAllMocks());

  it('deletes expired unattached files and marks their records deleted', async () => {
    const service = new MediaCleanupService(config, prisma, media);
    await expect(service.cleanupExpiredUploads()).resolves.toEqual({ checked: 1 });
    expect(media.deleteAsset).toHaveBeenCalledWith({
      publicId: expiredUpload.publicId,
      resourceType: 'image',
    });
    expect(prisma.pendingMediaUpload.update).toHaveBeenCalledWith({
      where: { id: expiredUpload.id },
      data: { status: PendingMediaStatus.DELETED },
    });
    expect(prisma.pendingMediaUpload.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            in: expect.arrayContaining([PendingMediaStatus.DELETE_PENDING]),
          },
        }),
      }),
    );
  });

  it('keeps an expired item pending when Cloudinary deletion fails so it can retry', async () => {
    (media.deleteAsset as jest.Mock).mockRejectedValueOnce(new Error('temporary failure'));
    const service = new MediaCleanupService(config, prisma, media);
    await expect(service.cleanupExpiredUploads()).resolves.toEqual({ checked: 1 });
    expect(prisma.pendingMediaUpload.update).not.toHaveBeenCalled();
  });
});
