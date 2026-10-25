import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResourceType } from '@prisma/client';
import type { AppConfig } from '../src/config/env.validation';
import type { PrismaService } from '../src/database/prisma.service';
import { MediaResourceType, MediaUploadContext } from '../src/modules/media/dto/media.dto';
import { MediaService } from '../src/modules/media/media.service';

describe('Media service safety', () => {
  const values: Record<string, unknown> = {
    CLOUDINARY_CLOUD_NAME: 'cooktale-test-cloud',
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
    CLOUDINARY_ROOT_FOLDER: 'cooktale',
  };
  const config = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService<AppConfig, true>;
  const prisma = {
    recipe: { findFirst: jest.fn() },
    blog: { findFirst: jest.fn() },
    story: { findFirst: jest.fn() },
    discussion: { findFirst: jest.fn() },
    pendingMediaUpload: {
      create: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  let service: MediaService;
  let signSpy: jest.SpyInstance;
  let destroySpy: jest.SpyInstance;
  let renameSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    signSpy = jest.spyOn(cloudinary.utils, 'api_sign_request').mockReturnValue('signed-value');
    destroySpy = jest
      .spyOn(cloudinary.uploader, 'destroy')
      .mockResolvedValue({ result: 'ok' } as never);
    renameSpy = jest.spyOn(cloudinary.uploader, 'rename');
    service = new MediaService(config, prisma);
  });

  afterEach(() => {
    signSpy.mockRestore();
    destroySpy.mockRestore();
    renameSpy.mockRestore();
  });

  it('creates a server-owned avatar upload signature without exposing the API secret', async () => {
    const result = await service.createSignedUpload({
      userId: 'user-1',
      context: MediaUploadContext.USER_AVATAR,
      resourceType: MediaResourceType.IMAGE,
    });

    expect(result.folder).toBe('cooktale/users/user-1/avatar');
    expect(result.publicId).toMatch(/^cooktale\/users\/user-1\/avatar\//);
    expect(result.resourceType).toBe(MediaResourceType.IMAGE);
    expect(result.params.transformation).toBe('c_limit,w_2560,h_2560/q_auto:good');
    expect(result).not.toHaveProperty('apiSecret');
    expect(signSpy).toHaveBeenCalledWith(
      expect.objectContaining({ folder: result.folder, overwrite: false }),
      'test-api-secret',
    );
    expect(prisma.pendingMediaUpload.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        publicId: result.publicId,
      }),
    });
  });

  it('requires recipe ownership before signing recipe media', async () => {
    const findRecipe = (prisma.recipe.findFirst as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      service.createSignedUpload({
        userId: 'user-1',
        context: MediaUploadContext.RECIPE_MAIN,
        entityId: 'recipe-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    findRecipe.mockResolvedValueOnce({ id: 'recipe-1' });
    const signed = await service.createSignedUpload({
      userId: 'user-1',
      context: MediaUploadContext.RECIPE_MAIN,
      entityId: 'recipe-1',
    });
    expect(signed.folder).toBe('cooktale/recipes/recipe-1/main');
    expect(findRecipe).toHaveBeenLastCalledWith({
      where: { id: 'recipe-1', authorId: 'user-1', deletedAt: null },
      select: { id: true },
    });
  });

  it('requires story and thread ownership before signing their media', async () => {
    (prisma.story.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      service.createSignedUpload({
        userId: 'user-1',
        context: MediaUploadContext.STORY_COVER,
        entityId: 'story-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    (prisma.discussion.findFirst as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      service.createSignedUpload({
        userId: 'user-1',
        context: MediaUploadContext.THREAD_MEDIA,
        entityId: 'thread-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires entity IDs and enforces the resource type for each context', async () => {
    await expect(
      service.createSignedUpload({
        userId: 'user-1',
        context: MediaUploadContext.RECIPE_VIDEO,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    (prisma.recipe.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'recipe-1' });
    await expect(
      service.createSignedUpload({
        userId: 'user-1',
        context: MediaUploadContext.RECIPE_VIDEO,
        entityId: 'recipe-1',
        resourceType: MediaResourceType.IMAGE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows video only for a story content block and applies the video upload policy', async () => {
    (prisma.story.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'story-1' });

    const result = await service.createSignedUpload({
      userId: 'user-1',
      context: MediaUploadContext.STORY_CONTENT,
      entityId: 'story-1',
      resourceType: MediaResourceType.VIDEO,
    });

    expect(result.folder).toBe('cooktale/stories/story-1/content');
    expect(result.resourceType).toBe(MediaResourceType.VIDEO);
    expect(result.params.transformation).toBe('c_limit,w_1920,h_1080/q_auto:good/vc_auto');
  });

  it('validates profile public IDs and Cloudinary URLs', () => {
    expect(() =>
      service.assertOwnedProfileAsset(
        'user-1',
        'cooktale/users/user-2/avatar/file',
        MediaUploadContext.USER_AVATAR,
      ),
    ).toThrow(ForbiddenException);

    expect(() => service.assertCloudinaryUrl('https://attacker.example/image.jpg')).toThrow(
      BadRequestException,
    );
    expect(() =>
      service.assertCloudinaryUrl(
        'https://res.cloudinary.com/cooktale-test-cloud/image/upload/avatar.jpg',
      ),
    ).not.toThrow();
  });

  it('physically deletes owned assets with CDN invalidation', async () => {
    const publicId = 'cooktale/users/user-1/avatar/file';
    await expect(
      service.deleteOwnAsset('user-1', {
        publicId,
        resourceType: MediaResourceType.IMAGE,
      }),
    ).resolves.toEqual({ publicId, result: 'ok' });

    expect(destroySpy).toHaveBeenCalledWith(publicId, {
      resource_type: MediaResourceType.IMAGE,
      invalidate: true,
    });
  });

  it('rejects deletion outside the user profile and temporary folders', async () => {
    await expect(
      service.deleteOwnAsset('user-1', {
        publicId: 'cooktale/users/user-2/avatar/file',
        resourceType: MediaResourceType.IMAGE,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(destroySpy).not.toHaveBeenCalled();
  });

  it('reports Cloudinary deletion failures instead of claiming success', async () => {
    destroySpy.mockRejectedValueOnce(new Error('Cloudinary unavailable'));

    await expect(
      service.deleteOwnAsset('user-1', {
        publicId: 'cooktale/users/user-1/avatar/file',
        resourceType: MediaResourceType.IMAGE,
      }),
    ).rejects.toThrow('Cloudinary unavailable');
  });

  it('allows only uploads tracked for the same user to be attached', async () => {
    (prisma.pendingMediaUpload.count as jest.Mock).mockResolvedValueOnce(2);
    await expect(
      service.assertAttachableUploads('user-1', ['cooktale/tmp/a', 'cooktale/tmp/b']),
    ).resolves.toBeUndefined();

    (prisma.pendingMediaUpload.count as jest.Mock).mockResolvedValueOnce(1);
    await expect(
      service.assertAttachableUploads('user-1', ['cooktale/tmp/a', 'cooktale/tmp/b']),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('adds automatic format and quality delivery settings to relocated thread images', async () => {
    (prisma.pendingMediaUpload.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'upload-1',
        publicId: 'cooktale/tmp/user-1/thread-image',
        resourceType: CloudinaryResourceType.IMAGE,
      },
    ]);
    renameSpy.mockResolvedValueOnce({
      secure_url:
        'https://res.cloudinary.com/cooktale-test-cloud/image/upload/v1/thread-image.jpg',
    });

    const moved = await service.relocateThreadUploads('user-1', 'thread-1', [
      'cooktale/tmp/user-1/thread-image',
    ]);

    expect(moved.get('cooktale/tmp/user-1/thread-image')).toEqual({
      publicId: 'cooktale/community/threads/thread-1/thread-image',
      url: 'https://res.cloudinary.com/cooktale-test-cloud/image/upload/f_auto/q_auto/v1/thread-image.jpg',
    });
  });

  it('queues removed recipe media for reliable worker deletion', async () => {
    await service.scheduleDeletion('user-1', [
      {
        publicId: 'cooktale/recipes/recipe-1/main/old',
        resourceType: CloudinaryResourceType.IMAGE,
      },
    ]);

    expect(prisma.pendingMediaUpload.upsert).toHaveBeenCalledWith({
      where: { publicId: 'cooktale/recipes/recipe-1/main/old' },
      create: expect.objectContaining({
        userId: 'user-1',
        status: 'DELETE_PENDING',
      }),
      update: expect.objectContaining({ status: 'DELETE_PENDING' }),
    });
  });
});
