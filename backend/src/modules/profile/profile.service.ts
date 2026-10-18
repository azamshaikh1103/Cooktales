import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, Prisma, RecipeStatus, StoryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import type { AppConfig } from '../../config/env.validation';
import { MediaResourceType, MediaUploadContext } from '../media/dto/media.dto';
import { MediaService } from '../media/media.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ChangePasswordDto,
  ProfileBookmarksQueryDto,
  ProfilePageQueryDto,
  UpdateNotificationsDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly notifications: NotificationsService,
  ) {}

  async getPublicProfile(handle: string) {
    const resolved = await this.resolveProfile(handle);
    const profile = await this.prisma.user.findUnique({
      where: { id: resolved.userId },
      select: this.publicProfileSelect(),
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      profile: this.serializePublicProfile(profile),
      canonicalHandle: profile.username || profile.id,
      redirectedFrom: resolved.redirectedFrom,
    };
  }

  async getProfileRecipes(handle: string, query: ProfilePageQueryDto) {
    const resolved = await this.resolveProfile(handle);
    const where: Prisma.RecipeWhereInput = {
      authorId: resolved.userId,
      status: RecipeStatus.PUBLISHED,
      deletedAt: null,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: this.profileRecipeSelect(),
      }),
      this.prisma.recipe.count({ where }),
    ]);
    return this.paginated(items, total, query);
  }

  async getProfileStories(handle: string, query: ProfilePageQueryDto) {
    const resolved = await this.resolveProfile(handle);
    const where: Prisma.StoryWhereInput = {
      authorId: resolved.userId,
      status: StoryStatus.PUBLISHED,
      deletedAt: null,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: this.profileStorySelect(),
      }),
      this.prisma.story.count({ where }),
    ]);
    return this.paginated(items, total, query);
  }

  async getFollowers(handle: string, query: ProfilePageQueryDto) {
    const resolved = await this.resolveProfile(handle);
    const where: Prisma.FollowerWhereInput = {
      userId: resolved.userId,
      follower: { status: AccountStatus.ACTIVE, deletedAt: null },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.follower.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: { follower: { select: this.profileListUserSelect() } },
      }),
      this.prisma.follower.count({ where }),
    ]);
    return this.paginated(
      rows.map((row) => row.follower),
      total,
      query,
    );
  }

  async getFollowing(handle: string, query: ProfilePageQueryDto) {
    const resolved = await this.resolveProfile(handle);
    const where: Prisma.FollowingWhereInput = {
      userId: resolved.userId,
      following: { status: AccountStatus.ACTIVE, deletedAt: null },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.following.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: { following: { select: this.profileListUserSelect() } },
      }),
      this.prisma.following.count({ where }),
    ]);
    return this.paginated(
      rows.map((row) => row.following),
      total,
      query,
    );
  }

  async getViewerProfileContext(handle: string, viewerId: string) {
    const resolved = await this.resolveProfile(handle);
    const profile = await this.prisma.user.findUnique({
      where: { id: resolved.userId },
      select: {
        id: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const isOwnProfile = profile.id === viewerId;
    const isFollowing = isOwnProfile
      ? false
      : Boolean(
          await this.prisma.follower.findUnique({
            where: {
              userId_followerId: {
                userId: profile.id,
                followerId: viewerId,
              },
            },
            select: { id: true },
          }),
        );

    const savedCount = isOwnProfile
      ? await this.prisma.bookmark.count({ where: this.bookmarkWhere(viewerId, 'all') })
      : 0;

    return {
      profileId: profile.id,
      isOwnProfile,
      isFollowing,
      savedCount,
    };
  }

  async getMyBookmarks(userId: string, query: ProfileBookmarksQueryDto) {
    const where = this.bookmarkWhere(userId, query.type);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.bookmark.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          createdAt: true,
          recipe: { select: this.profileRecipeSelect() },
          story: { select: this.profileStorySelect() },
        },
      }),
      this.prisma.bookmark.count({ where }),
    ]);
    return this.paginated(items, total, query);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        imagePublicId: true,
        bannerImage: true,
        bannerImagePublicId: true,
        about: true,
        location: true,
        signature: true,
        mission: true,
        website: true,
        socialLinks: true,
        role: true,
        status: true,
        isPro: true,
        plan: true,
        planStatus: true,
        planEndsAt: true,
        measurementSystem: true,
        language: true,
        timezone: true,
        dietaryPreferences: true,
        appSettings: true,
        notificationPreferences: true,
        createdAt: true,
        updatedAt: true,
        usernameChangedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        usernameChangeAvailableAt: this.usernameChangeAvailableAt(user.usernameChangedAt),
      },
    };
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    this.validateProfileMediaUpdate(userId, dto);
    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    const requestedUsername = dto.username?.trim().toLowerCase();
    if (dto.about !== undefined) data.about = dto.about.trim() || null;
    if (dto.location !== undefined) data.location = dto.location.trim() || null;
    if (dto.signature !== undefined) data.signature = dto.signature.trim() || null;
    if (dto.mission !== undefined) data.mission = dto.mission.trim() || null;
    if (dto.image !== undefined) data.image = dto.image;
    if (dto.imagePublicId !== undefined) data.imagePublicId = dto.imagePublicId;
    if (dto.bannerImage !== undefined) data.bannerImage = dto.bannerImage;
    if (dto.bannerImagePublicId !== undefined) data.bannerImagePublicId = dto.bannerImagePublicId;
    if (dto.website !== undefined) data.website = dto.website;
    if (dto.socialLinks !== undefined) data.socialLinks = dto.socialLinks;

    try {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          imagePublicId: true,
          bannerImagePublicId: true,
          username: true,
          usernameChangedAt: true,
        },
      });

      if (!currentUser) throw new UnauthorizedException('User not found');
      const usernameChanged =
        requestedUsername !== undefined && requestedUsername !== currentUser.username;
      if (usernameChanged) {
        await this.assertUsernameChangeAllowed(userId, requestedUsername, currentUser);
        data.username = requestedUsername;
        data.usernameChangedAt = new Date();
      }

      const select = {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        imagePublicId: true,
        bannerImage: true,
        bannerImagePublicId: true,
        about: true,
        location: true,
        signature: true,
        mission: true,
        website: true,
        socialLinks: true,
        updatedAt: true,
      } satisfies Prisma.UserSelect;
      const user = usernameChanged
        ? await this.prisma.$transaction(async (tx) => {
            await tx.usernameRedirect.deleteMany({
              where: { oldUsername: requestedUsername, userId },
            });
            if (currentUser.username) {
              await tx.usernameRedirect.upsert({
                where: { oldUsername: currentUser.username },
                create: { oldUsername: currentUser.username, userId },
                update: { userId },
              });
            }
            return tx.user.update({ where: { id: userId }, data, select });
          })
        : await this.prisma.user.update({ where: { id: userId }, data, select });

      await this.mediaService.markAttached(userId, [user.imagePublicId, user.bannerImagePublicId]);

      await this.cleanupReplacedProfileMedia({
        userId,
        oldImagePublicId: currentUser?.imagePublicId,
        newImagePublicId: user.imagePublicId,
        oldBannerImagePublicId: currentUser?.bannerImagePublicId,
        newBannerImagePublicId: user.bannerImagePublicId,
      });

      return {
        user: {
          ...user,
          updatedAt: user.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'username')) {
        throw new ConflictException('Username is already taken');
      }
      throw error;
    }
  }

  async checkUsernameAvailability(userId: string, username: string) {
    const normalizedUsername = username?.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername || '')) {
      return {
        available: false,
        message: 'Invalid format. Use 3-20 letters, numbers, or underscores.',
      };
    }

    const [user, redirect] = await Promise.all([
      this.prisma.user.findUnique({
        where: { username: normalizedUsername },
        select: { id: true },
      }),
      this.prisma.usernameRedirect.findUnique({
        where: { oldUsername: normalizedUsername },
        select: { userId: true },
      }),
    ]);
    const reservedByAnother =
      (user && user.id !== userId) || (redirect && redirect.userId !== userId);

    return {
      available: !reservedByAnother,
      message: reservedByAnother ? 'Username is already taken' : undefined,
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        measurementSystem: dto.measurementSystem,
        language: dto.language,
        timezone: dto.timezone,
        dietaryPreferences: dto.dietaryPreferences,
        appSettings: dto.appSettings,
      },
      select: {
        id: true,
        measurementSystem: true,
        language: true,
        timezone: true,
        dietaryPreferences: true,
        appSettings: true,
      },
    });

    return { user };
  }

  async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
    const user = await this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });
      if (!current) throw new UnauthorizedException('User not found');
      const existing =
        current.notificationPreferences && typeof current.notificationPreferences === 'object'
          ? (current.notificationPreferences as Record<string, unknown>)
          : {};
      return tx.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: { ...existing, ...dto },
        },
        select: {
          id: true,
          notificationPreferences: true,
        },
      });
    });

    return { user };
  }

  async followUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException("You can't follow yourself");
    }

    const target = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
        status: AccountStatus.ACTIVE,
      },
      select: { id: true, username: true },
    });

    if (!target) {
      throw new NotFoundException('Profile not found');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const following = await tx.following.createMany({
        data: [{ userId, followingId: targetUserId }],
        skipDuplicates: true,
      });
      await tx.follower.createMany({
        data: [{ userId: targetUserId, followerId: userId }],
        skipDuplicates: true,
      });
      return Boolean(following.count);
    });

    if (created) {
      await this.notifications.create({
        recipientId: targetUserId,
        actorId: userId,
        type: 'FOLLOW',
        targetPath: `/profile/${target.username || target.id}`,
        dedupeKey: `follow:${userId}`,
      });
    }

    return { isFollowing: true };
  }

  async unfollowUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException("You can't unfollow yourself");
    }

    await this.prisma.$transaction([
      this.prisma.following.deleteMany({
        where: {
          userId,
          followingId: targetUserId,
        },
      }),
      this.prisma.follower.deleteMany({
        where: {
          userId: targetUserId,
          followerId: userId,
        },
      }),
    ]);

    return { isFollowing: false };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user?.password) {
      throw new BadRequestException('Password cannot be changed for OAuth-only accounts');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const password = await bcrypt.hash(dto.newPassword, 12);
    const revokedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password },
      }),
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt },
      }),
    ]);

    return { message: 'Password changed successfully' };
  }

  async exportData(userId: string) {
    const account = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        imagePublicId: true,
        bannerImage: true,
        bannerImagePublicId: true,
        about: true,
        location: true,
        signature: true,
        mission: true,
        website: true,
        socialLinks: true,
        role: true,
        status: true,
        isPro: true,
        plan: true,
        planStatus: true,
        planEndsAt: true,
        measurementSystem: true,
        language: true,
        timezone: true,
        dietaryPreferences: true,
        appSettings: true,
        notificationPreferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new UnauthorizedException('User not found');
    }

    const [
      recipes,
      stories,
      discussions,
      comments,
      bookmarks,
      collections,
      reviews,
      ratings,
      likes,
      followers,
      following,
      pointHistory,
      challengeEntries,
      invoices,
    ] = await Promise.all([
      this.prisma.recipe.findMany({
        where: { authorId: userId },
        include: { ingredients: true, equipments: true, steps: true, faqs: true, media: true },
      }),
      this.prisma.story.findMany({ where: { authorId: userId }, include: { content: true, media: true } }),
      this.prisma.discussion.findMany({ where: { authorId: userId } }),
      this.prisma.comment.findMany({ where: { authorId: userId } }),
      this.prisma.bookmark.findMany({ where: { userId } }),
      this.prisma.collection.findMany({
        where: { userId },
        include: { recipes: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.review.findMany({ where: { userId } }),
      this.prisma.rating.findMany({ where: { userId } }),
      this.prisma.like.findMany({ where: { userId } }),
      this.prisma.follower.findMany({
        where: { userId },
        select: { createdAt: true, follower: { select: this.profileListUserSelect() } },
      }),
      this.prisma.following.findMany({
        where: { userId },
        select: { createdAt: true, following: { select: this.profileListUserSelect() } },
      }),
      this.prisma.pointHistory.findMany({ where: { userId } }),
      this.prisma.challengeEntry.findMany({ where: { userId } }),
      this.prisma.invoice.findMany({ where: { userId } }),
    ]);

    return {
      data: {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        account,
        recipes,
        stories,
        discussions,
        comments,
        bookmarks,
        collections,
        reviews,
        ratings,
        likes,
        followers,
        following,
        pointHistory,
        challengeEntries,
        invoices,
      },
    };
  }

  async deactivateMe(userId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { imagePublicId: true, bannerImagePublicId: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: AccountStatus.DELETED,
        authSessions: {
          updateMany: {
            where: { revokedAt: null },
            data: { revokedAt: new Date() },
          },
        },
      },
    });

    await this.cleanupReplacedProfileMedia({
      userId,
      oldImagePublicId: currentUser?.imagePublicId,
      newImagePublicId: null,
      oldBannerImagePublicId: currentUser?.bannerImagePublicId,
      newBannerImagePublicId: null,
    });

    return { message: 'Account deactivated' };
  }

  private async resolveProfile(handle: string) {
    const normalized = handle.trim().toLowerCase();
    const direct = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: normalized }, { id: handle }],
        deletedAt: null,
        status: AccountStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (direct) return { userId: direct.id, redirectedFrom: null as string | null };

    const redirect = await this.prisma.usernameRedirect.findUnique({
      where: { oldUsername: normalized },
      select: {
        userId: true,
        user: { select: { status: true, deletedAt: true } },
      },
    });
    if (
      !redirect ||
      redirect.user.status !== AccountStatus.ACTIVE ||
      redirect.user.deletedAt !== null
    ) {
      throw new NotFoundException('Profile not found');
    }

    return { userId: redirect.userId, redirectedFrom: normalized };
  }

  private async assertUsernameChangeAllowed(
    userId: string,
    username: string,
    current: { username: string | null; usernameChangedAt: Date | null },
  ) {
    const availableAt = this.usernameChangeAvailableAt(current.usernameChangedAt);
    if (availableAt && new Date(availableAt).getTime() > Date.now()) {
      throw new HttpException(
        `Username can be changed again after ${availableAt}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const [existingUser, existingRedirect] = await Promise.all([
      this.prisma.user.findUnique({ where: { username }, select: { id: true } }),
      this.prisma.usernameRedirect.findUnique({
        where: { oldUsername: username },
        select: { userId: true },
      }),
    ]);
    if (
      (existingUser && existingUser.id !== userId) ||
      (existingRedirect && existingRedirect.userId !== userId)
    ) {
      throw new ConflictException('Username is already taken');
    }
  }

  private usernameChangeAvailableAt(changedAt: Date | null) {
    if (!changedAt) return null;
    const days = this.config.get('PROFILE_USERNAME_CHANGE_COOLDOWN_DAYS', { infer: true });
    return new Date(changedAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  private paginated<T>(items: T[], total: number, query: ProfilePageQueryDto) {
    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
      hasMore: query.page * query.limit < total,
    };
  }

  private bookmarkWhere(userId: string, type: ProfileBookmarksQueryDto['type']) {
    const recipe = { recipe: { status: RecipeStatus.PUBLISHED, deletedAt: null } };
    const story = { story: { status: StoryStatus.PUBLISHED, deletedAt: null } };
    if (type === 'recipes') return { userId, ...recipe };
    if (type === 'stories') return { userId, ...story };
    return { userId, OR: [recipe, story] };
  }

  private profileRecipeSelect() {
    return {
      id: true,
      slug: true,
      name: true,
      mainImage: true,
      totalTimeReq: true,
      yield: true,
      diet: true,
      ratings: true,
      createdAt: true,
      publishedAt: true,
    } satisfies Prisma.RecipeSelect;
  }

  private profileStorySelect() {
    return {
      id: true,
      slug: true,
      coverImage: true,
      title: true,
      createdAt: true,
      likes: true,
      dislikes: true,
      shortDesc: true,
    } satisfies Prisma.StorySelect;
  }

  private profileListUserSelect() {
    return {
      id: true,
      name: true,
      username: true,
      image: true,
      about: true,
      isPro: true,
    } satisfies Prisma.UserSelect;
  }

  private publicProfileSelect() {
    return {
      id: true,
      name: true,
      username: true,
      image: true,
      bannerImage: true,
      about: true,
      location: true,
      mission: true,
      signature: true,
      website: true,
      socialLinks: true,
      isPro: true,
      plan: true,
      createdAt: true,
      _count: {
        select: {
          recipes: {
            where: { status: RecipeStatus.PUBLISHED, deletedAt: null },
          },
          stories: { where: { status: StoryStatus.PUBLISHED, deletedAt: null } },
          followers: true,
          following: true,
        },
      },
      recipes: {
        where: { status: RecipeStatus.PUBLISHED, deletedAt: null },
        take: 6,
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          name: true,
          mainImage: true,
          totalTimeReq: true,
          yield: true,
          diet: true,
          ratings: true,
          createdAt: true,
        },
      },
      stories: {
        take: 6,
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          coverImage: true,
          title: true,
          createdAt: true,
          likes: true,
          dislikes: true,
          shortDesc: true,
        },
      },
    };
  }

  private serializePublicProfile(
    profile: Prisma.UserGetPayload<{ select: ReturnType<ProfileService['publicProfileSelect']> }>,
  ) {
    return {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      recipes: profile.recipes.map((recipe) => ({
        ...recipe,
        createdAt: recipe.createdAt.toISOString(),
      })),
      stories: profile.stories.map((story) => ({
        ...story,
        createdAt: story.createdAt.toISOString(),
      })),
    };
  }

  private async cleanupReplacedProfileMedia(input: {
    userId: string;
    oldImagePublicId?: string | null;
    newImagePublicId?: string | null;
    oldBannerImagePublicId?: string | null;
    newBannerImagePublicId?: string | null;
  }) {
    await Promise.all([
      this.cleanupReplacedAsset(input.userId, input.oldImagePublicId, input.newImagePublicId),
      this.cleanupReplacedAsset(
        input.userId,
        input.oldBannerImagePublicId,
        input.newBannerImagePublicId,
      ),
    ]);
  }

  private validateProfileMediaUpdate(userId: string, dto: UpdateProfileDto) {
    this.validateProfileAssetPair({
      userId,
      url: dto.image,
      publicId: dto.imagePublicId,
      context: MediaUploadContext.USER_AVATAR,
      label: 'Profile image',
    });
    this.validateProfileAssetPair({
      userId,
      url: dto.bannerImage,
      publicId: dto.bannerImagePublicId,
      context: MediaUploadContext.USER_BANNER,
      label: 'Banner image',
    });
  }

  private validateProfileAssetPair(input: {
    userId: string;
    url?: string | null;
    publicId?: string | null;
    context: MediaUploadContext.USER_AVATAR | MediaUploadContext.USER_BANNER;
    label: string;
  }) {
    const hasUrlField = input.url !== undefined;
    const hasPublicIdField = input.publicId !== undefined;
    if (!hasUrlField && !hasPublicIdField) return;

    if (hasUrlField !== hasPublicIdField) {
      throw new BadRequestException(`${input.label} URL and public ID must be updated together`);
    }

    if (input.url === null && input.publicId === null) return;
    if (!input.url || !input.publicId) {
      throw new BadRequestException(`${input.label} URL and public ID must both be provided`);
    }

    this.mediaService.assertCloudinaryUrl(input.url);
    this.mediaService.assertOwnedProfileAsset(input.userId, input.publicId, input.context);
  }

  private async cleanupReplacedAsset(
    userId: string,
    oldPublicId?: string | null,
    newPublicId?: string | null,
  ) {
    if (!oldPublicId || oldPublicId === newPublicId) return;

    try {
      await this.mediaService.deleteOwnAsset(userId, {
        publicId: oldPublicId,
        resourceType: MediaResourceType.IMAGE,
      });
    } catch (error) {
      this.logger.warn(
        `Profile media cleanup failed for ${oldPublicId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private isUniqueConstraintError(error: unknown, field: string) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes(field)
    );
  }
}
