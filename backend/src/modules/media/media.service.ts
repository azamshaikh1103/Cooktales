import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { CloudinaryResourceType, PendingMediaStatus } from '@prisma/client';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { type ConfirmMediaUploadDto, MediaResourceType, MediaUploadContext } from './dto/media.dto';

type SignedUploadInput = {
  userId: string;
  context: MediaUploadContext;
  entityId?: string;
  resourceType?: MediaResourceType;
};

type DeleteAssetInput = {
  publicId: string;
  resourceType?: Exclude<MediaResourceType, MediaResourceType.AUTO>;
};

@Injectable()
export class MediaService {
  private readonly rootFolder: string;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    this.rootFolder = this.config.get('CLOUDINARY_ROOT_FOLDER', { infer: true });
    this.configureCloudinary();
  }

  async createSignedUpload(input: SignedUploadInput) {
    this.ensureConfigured();
    await this.assertCanUpload(input);

    const resourceType = this.resolveResourceType(input);
    const folder = this.resolveFolder(input);
    const publicId = randomUUID();
    const timestamp = Math.floor(Date.now() / 1000);
    const tags = this.resolveTags(input);

    const uploadParams = {
      folder,
      public_id: publicId,
      timestamp,
      overwrite: false,
      tags,
    };

    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      this.config.get('CLOUDINARY_API_SECRET', { infer: true }) || '',
    );

    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = this.config.get('CLOUDINARY_API_KEY', { infer: true });
    const fullPublicId = `${folder}/${publicId}`;
    const ttlHours = this.config.get('MEDIA_PENDING_UPLOAD_TTL_HOURS', { infer: true }) || 24;

    await this.prisma.pendingMediaUpload.create({
      data: {
        userId: input.userId,
        publicId: fullPublicId,
        context: input.context,
        entityId: input.entityId,
        resourceType: this.toDatabaseResourceType(resourceType),
        expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
      },
    });

    return {
      cloudName,
      apiKey,
      signature,
      timestamp,
      folder,
      publicId: fullPublicId,
      resourceType,
      tags,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      params: uploadParams,
    };
  }

  async confirmUpload(userId: string, dto: ConfirmMediaUploadDto) {
    this.assertCloudinaryUrl(dto.url);
    const upload = await this.prisma.pendingMediaUpload.findFirst({
      where: { publicId: dto.publicId, userId },
      select: { id: true, resourceType: true, status: true },
    });

    if (!upload) throw new ForbiddenException('Upload does not belong to this user');
    if (upload.status === PendingMediaStatus.DELETED) {
      throw new BadRequestException('Upload has already been deleted');
    }
    if (upload.resourceType !== this.toDatabaseResourceType(dto.resourceType)) {
      throw new BadRequestException('Uploaded resource type does not match the signed upload');
    }

    await this.prisma.pendingMediaUpload.update({
      where: { id: upload.id },
      data: {
        status: PendingMediaStatus.UPLOADED,
        url: dto.url,
        width: dto.width,
        height: dto.height,
        bytes: dto.bytes,
        format: dto.format,
        confirmedAt: new Date(),
      },
    });

    return { confirmed: true };
  }

  async markAttached(userId: string, publicIds: Array<string | null | undefined>) {
    const uniquePublicIds = [...new Set(publicIds.filter((id): id is string => Boolean(id)))];
    if (!uniquePublicIds.length) return;

    await this.prisma.pendingMediaUpload.updateMany({
      where: {
        userId,
        publicId: { in: uniquePublicIds },
        status: { in: [PendingMediaStatus.PENDING, PendingMediaStatus.UPLOADED] },
      },
      data: {
        status: PendingMediaStatus.ATTACHED,
        attachedAt: new Date(),
      },
    });
  }

  async relocateThreadUploads(userId: string, discussionId: string, publicIds: string[]) {
    this.ensureConfigured();
    const uniquePublicIds = [...new Set(publicIds)];
    if (!uniquePublicIds.length) return new Map<string, { publicId: string; url: string }>();

    const uploads = await this.prisma.pendingMediaUpload.findMany({
      where: { userId, publicId: { in: uniquePublicIds }, status: { in: [PendingMediaStatus.PENDING, PendingMediaStatus.UPLOADED] } },
      select: { id: true, publicId: true, resourceType: true },
    });
    if (uploads.length !== uniquePublicIds.length) {
      throw new ForbiddenException('One or more media files do not belong to this user');
    }

    const folder = `${this.rootFolder}/community/threads/${discussionId}`;
    const moved = new Map<string, { publicId: string; url: string }>();
    for (const upload of uploads) {
      const assetId = upload.publicId.split('/').pop();
      if (!assetId) throw new BadRequestException('Invalid media id');
      const publicId = `${folder}/${assetId}`;
      const result = await cloudinary.uploader.rename(upload.publicId, publicId, {
        resource_type: this.toMediaResourceType(upload.resourceType),
        overwrite: false,
        invalidate: true,
      });
      const url = this.withAutoOptimization(result.secure_url);
      await this.prisma.pendingMediaUpload.update({
        where: { id: upload.id },
        data: { publicId, url, status: PendingMediaStatus.ATTACHED, attachedAt: new Date() },
      });
      moved.set(upload.publicId, { publicId, url });
    }
    return moved;
  }

  async assertAttachableUploads(userId: string, publicIds: string[]) {
    const uniquePublicIds = [...new Set(publicIds)];
    if (!uniquePublicIds.length) return;
    const count = await this.prisma.pendingMediaUpload.count({
      where: {
        userId,
        publicId: { in: uniquePublicIds },
        status: {
          in: [
            PendingMediaStatus.PENDING,
            PendingMediaStatus.UPLOADED,
            PendingMediaStatus.ATTACHED,
          ],
        },
      },
    });
    if (count !== uniquePublicIds.length) {
      throw new ForbiddenException('One or more media files do not belong to this user');
    }
  }

  async scheduleDeletion(
    userId: string,
    assets: Array<{ publicId: string; resourceType: CloudinaryResourceType }>,
  ) {
    await Promise.all(
      assets.map((asset) =>
        this.prisma.pendingMediaUpload.upsert({
          where: { publicId: asset.publicId },
          create: {
            userId,
            publicId: asset.publicId,
            context: 'RECIPE_REMOVED',
            resourceType: asset.resourceType,
            status: PendingMediaStatus.DELETE_PENDING,
            expiresAt: new Date(),
          },
          update: {
            status: PendingMediaStatus.DELETE_PENDING,
            expiresAt: new Date(),
          },
        }),
      ),
    );
  }

  async deleteOwnAsset(userId: string, input: DeleteAssetInput) {
    this.ensureConfigured();
    this.assertUserCanDeleteAsset(userId, input.publicId);

    const result = await this.deleteAsset(input);
    await this.prisma.pendingMediaUpload.updateMany({
      where: { userId, publicId: input.publicId },
      data: { status: PendingMediaStatus.DELETED },
    });
    return result;
  }

  assertOwnedProfileAsset(
    userId: string,
    publicId: string,
    context: MediaUploadContext.USER_AVATAR | MediaUploadContext.USER_BANNER,
  ) {
    const folder = this.resolveFolder({ userId, context });
    if (!publicId.startsWith(`${folder}/`) || publicId.length <= folder.length + 1) {
      throw new ForbiddenException('Profile media does not belong to this user');
    }
  }

  assertCloudinaryUrl(url: string) {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    if (!cloudName || !url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
      throw new BadRequestException('Media URL must belong to the configured Cloudinary account');
    }
  }

  async deleteAsset(input: DeleteAssetInput) {
    this.ensureConfigured();

    const result = await cloudinary.uploader.destroy(input.publicId, {
      resource_type: input.resourceType || MediaResourceType.IMAGE,
      invalidate: true,
    });
    await this.prisma.pendingMediaUpload.updateMany({
      where: { publicId: input.publicId },
      data: { status: PendingMediaStatus.DELETED },
    });

    return {
      publicId: input.publicId,
      result: result.result,
    };
  }

  async uploadRemoteImage(url: string, folder: string): Promise<UploadApiResponse> {
    this.ensureConfigured();

    return cloudinary.uploader.upload(url, {
      folder,
      overwrite: false,
      resource_type: MediaResourceType.IMAGE,
    });
  }

  private configureCloudinary() {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = this.config.get('CLOUDINARY_API_KEY', { infer: true });
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', { infer: true });

    if (!cloudName || !apiKey || !apiSecret) return;

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private ensureConfigured() {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    const apiKey = this.config.get('CLOUDINARY_API_KEY', { infer: true });
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET', { infer: true });

    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Cloudinary is not configured');
    }
  }

  private resolveFolder(input: SignedUploadInput) {
    switch (input.context) {
      case MediaUploadContext.USER_AVATAR:
        return `${this.rootFolder}/users/${input.userId}/avatar`;
      case MediaUploadContext.USER_BANNER:
        return `${this.rootFolder}/users/${input.userId}/banner`;
      case MediaUploadContext.RECIPE_MAIN:
        return `${this.rootFolder}/recipes/${this.requireEntityId(input)}/main`;
      case MediaUploadContext.RECIPE_GALLERY:
        return `${this.rootFolder}/recipes/${this.requireEntityId(input)}/gallery`;
      case MediaUploadContext.RECIPE_VIDEO:
        return `${this.rootFolder}/recipes/${this.requireEntityId(input)}/videos`;
      case MediaUploadContext.STORY_COVER:
        return `${this.rootFolder}/stories/${this.requireEntityId(input)}/cover`;
      case MediaUploadContext.STORY_CONTENT:
        return `${this.rootFolder}/stories/${this.requireEntityId(input)}/content`;
      case MediaUploadContext.THREAD_MEDIA:
        return `${this.rootFolder}/community/threads/${this.requireEntityId(input)}`;
      case MediaUploadContext.TEMP:
        return `${this.rootFolder}/tmp/${input.userId}`;
      default:
        throw new BadRequestException('Unsupported media context');
    }
  }

  private resolveResourceType(input: SignedUploadInput) {
    const expected =
      input.context === MediaUploadContext.RECIPE_VIDEO
        ? MediaResourceType.VIDEO
        : input.context === MediaUploadContext.TEMP
          ? input.resourceType || MediaResourceType.IMAGE
          : MediaResourceType.IMAGE;

    if (
      input.context !== MediaUploadContext.TEMP &&
      input.resourceType &&
      input.resourceType !== expected
    ) {
      throw new BadRequestException('Resource type is not allowed for this media context');
    }

    return expected;
  }

  private resolveTags(input: SignedUploadInput) {
    return ['cooktale', input.context.toLowerCase(), `user:${input.userId}`].join(',');
  }

  private requireEntityId(input: SignedUploadInput) {
    if (!input.entityId) {
      throw new BadRequestException('entityId is required for this media context');
    }

    return input.entityId;
  }

  private async assertCanUpload(input: SignedUploadInput) {
    switch (input.context) {
      case MediaUploadContext.RECIPE_MAIN:
      case MediaUploadContext.RECIPE_GALLERY:
      case MediaUploadContext.RECIPE_VIDEO: {
        const entityId = this.requireEntityId(input);
        const recipe = await this.prisma.recipe.findFirst({
          where: { id: entityId, authorId: input.userId, deletedAt: null },
          select: { id: true },
        });
        if (!recipe) throw new ForbiddenException('You cannot upload media for this recipe');
        return;
      }
      case MediaUploadContext.STORY_COVER:
      case MediaUploadContext.STORY_CONTENT: {
        const entityId = this.requireEntityId(input);
        const story = await this.prisma.story.findFirst({
          where: { id: entityId, authorId: input.userId, deletedAt: null },
          select: { id: true },
        });
        if (!story) throw new ForbiddenException('You cannot upload media for this story');
        return;
      }
      case MediaUploadContext.THREAD_MEDIA: {
        const entityId = this.requireEntityId(input);
        const thread = await this.prisma.discussion.findFirst({
          where: { id: entityId, authorId: input.userId },
          select: { id: true },
        });
        if (!thread) throw new ForbiddenException('You cannot upload media for this thread');
        return;
      }
      default:
        return;
    }
  }

  private assertUserCanDeleteAsset(userId: string, publicId: string) {
    const allowedPrefixes = [
      `${this.rootFolder}/users/${userId}/`,
      `${this.rootFolder}/tmp/${userId}/`,
    ];

    if (!allowedPrefixes.some((prefix) => publicId.startsWith(prefix))) {
      throw new ForbiddenException('You cannot delete this asset from this endpoint');
    }
  }

  private toDatabaseResourceType(resourceType: MediaResourceType): CloudinaryResourceType {
    if (resourceType === MediaResourceType.VIDEO) return CloudinaryResourceType.VIDEO;
    if (resourceType === MediaResourceType.RAW) return CloudinaryResourceType.RAW;
    return CloudinaryResourceType.IMAGE;
  }

  private toMediaResourceType(resourceType: CloudinaryResourceType) {
    if (resourceType === CloudinaryResourceType.VIDEO) return MediaResourceType.VIDEO;
    if (resourceType === CloudinaryResourceType.RAW) return MediaResourceType.RAW;
    return MediaResourceType.IMAGE;
  }

  private withAutoOptimization(url: string) {
    return url.includes('/upload/') && !url.includes('/upload/f_auto,q_auto/')
      ? url.replace('/upload/', '/upload/f_auto,q_auto/')
      : url;
  }
}
