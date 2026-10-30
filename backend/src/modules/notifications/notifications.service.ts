import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AppConfig } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';
import { ListNotificationsQueryDto } from './dto/notification.dto';
import { NotificationPushService } from './notification-push.service';
import { NotificationRealtimeService } from './notification-realtime.service';

type NotificationDatabase = PrismaService | Prisma.TransactionClient;

type CreateNotificationInput = {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  targetPath?: string | null;
  payload?: Prisma.InputJsonValue;
  dedupeKey?: string;
  force?: boolean;
};

const actorSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: NotificationPushService,
    private readonly realtime: NotificationRealtimeService,
    private readonly redis: RedisService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async create(input: CreateNotificationInput, database: NotificationDatabase = this.prisma) {
    if (!input.recipientId || input.recipientId === input.actorId) return null;

    try {
      const recipient = await database.user.findFirst({
        where: {
          id: input.recipientId,
          status: AccountStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true, notificationPreferences: true },
      });
      if (!recipient) return null;
      if (!input.force && !this.isEnabled(recipient.notificationPreferences, input.type)) return null;

      const data = {
        recipientId: input.recipientId,
        actorId: input.actorId || null,
        type: input.type,
        targetPath: input.targetPath || null,
        payload: input.payload || {},
        dedupeKey: input.dedupeKey,
      };

      const notification = !input.dedupeKey
        ? await database.notification.create({ data })
        : await database.notification.upsert({
        where: {
          recipientId_dedupeKey: {
            recipientId: input.recipientId,
            dedupeKey: input.dedupeKey,
          },
        },
        create: data,
        update: {
          actorId: data.actorId,
          type: data.type,
          targetPath: data.targetPath,
          payload: data.payload,
        },
      });
      if (database === this.prisma) {
        const serialized = await this.findSerialized(notification.id);
        await this.invalidateUnreadCount(notification.recipientId);
        const { unreadCount } = await this.unreadCount(notification.recipientId);
        if (serialized) {
          await this.realtime.publish({
            recipientId: notification.recipientId,
            event: 'notification.created',
            data: { notification: serialized, unreadCount },
          });
        }
        await this.push.enqueueForNotification(notification.id).catch((pushError: unknown) => {
          this.logger.warn(
            `Could not queue browser notification ${notification.id}: ${
              pushError instanceof Error ? pushError.message : 'unknown error'
            }`,
          );
        });
      }
      return notification;
    } catch (error) {
      this.logger.error('Could not create notification', error instanceof Error ? error.stack : error);
      return null;
    }
  }

  async list(userId: string, query: ListNotificationsQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };
    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { actor: { select: actorSelect } },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
    ]);

    return {
      notifications: items.map((item) => this.serialize(item)),
      page: query.page,
      limit: query.limit,
      total,
      unreadCount,
      hasMore: query.page * query.limit < total,
    };
  }

  async unreadCount(userId: string) {
    const cacheKey = this.unreadCountCacheKey(userId);
    try {
      const cached = await this.redis.getClient().get(cacheKey);
      if (cached !== null) {
        const unreadCount = Number(cached);
        if (Number.isSafeInteger(unreadCount) && unreadCount >= 0) return { unreadCount };
      }
    } catch (error) {
      this.logger.warn(`Unread notification cache unavailable: ${this.errorMessage(error)}`);
    }

    const unreadCount = await this.prisma.notification.count({ where: { recipientId: userId, readAt: null } });
    try {
      await this.redis.getClient().set(
        cacheKey,
        String(unreadCount),
        'EX',
        this.unreadCountCacheTtlSeconds(),
      );
    } catch (error) {
      this.logger.warn(`Could not cache unread notification count: ${this.errorMessage(error)}`);
    }
    return {
      unreadCount,
    };
  }

  async markRead(userId: string, notificationId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    if (!updated.count) {
      const exists = await this.prisma.notification.findFirst({
        where: { id: notificationId, recipientId: userId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Notification not found');
    }
    await this.invalidateUnreadCount(userId);
    const count = await this.unreadCount(userId);
    await this.realtime.publish({
      recipientId: userId,
      event: 'notification.read',
      data: { notificationId, unreadCount: count.unreadCount, readAt: new Date().toISOString() },
    });
    return count;
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    await this.invalidateUnreadCount(userId);
    await this.realtime.publish({
      recipientId: userId,
      event: 'notification.read-all',
      data: { unreadCount: 0, readAt: new Date().toISOString() },
    });
    return { unreadCount: 0 };
  }

  private serialize(item: {
    id: string;
    type: NotificationType;
    targetPath: string | null;
    payload: Prisma.JsonValue;
    readAt: Date | null;
    createdAt: Date;
    actor: { id: string; name: string; username: string | null; image: string | null } | null;
  }) {
    return {
      id: item.id,
      type: item.type,
      targetPath: item.targetPath,
      payload: item.payload,
      readAt: item.readAt?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      actor: item.actor,
    };
  }

  private async findSerialized(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { actor: { select: actorSelect } },
    });
    return notification ? this.serialize(notification) : null;
  }

  private unreadCountCacheKey(userId: string) {
    return `cooktale:notifications:unread:v1:${userId}`;
  }

  private unreadCountCacheTtlSeconds() {
    return this.config.get('NOTIFICATION_UNREAD_CACHE_TTL_SECONDS', { infer: true });
  }

  private async invalidateUnreadCount(userId: string) {
    try {
      await this.redis.getClient().del(this.unreadCountCacheKey(userId));
    } catch (error) {
      this.logger.warn(`Could not clear unread notification cache: ${this.errorMessage(error)}`);
    }
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'unknown error';
  }

  private isEnabled(preferences: Prisma.JsonValue | null, type: NotificationType) {
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) return true;
    const key = this.preferenceKey(type);
    return (preferences as Record<string, unknown>)[key] !== false;
  }

  private preferenceKey(type: NotificationType) {
    if (type === NotificationType.FOLLOW) return 'in_app_follows';
    if (type === NotificationType.RECIPE_LIKE || type === NotificationType.STORY_LIKE)
      return 'in_app_likes';
    if (
      type === NotificationType.RECIPE_COMMENT ||
      type === NotificationType.STORY_COMMENT ||
      type === NotificationType.RECIPE_COMMENT_REPLY ||
      type === NotificationType.STORY_COMMENT_REPLY
    )
      return 'in_app_comments';
    if (type === NotificationType.RECIPE_REVIEW || type === NotificationType.RECIPE_REVIEW_REPLY)
      return 'in_app_reviews';
    return 'in_app_system';
  }
}
