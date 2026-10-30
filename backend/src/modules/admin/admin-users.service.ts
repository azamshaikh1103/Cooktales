import { ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AccountStatus, AdminUserModerationActionType, Prisma, UserRole } from '@prisma/client';
import { AuthMailerService } from '../auth/mailer/auth-mailer.service';
import { EmailQueueService } from '../auth/mailer/email-queue.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminUserKind, AdminUserReasonDto, ListAdminUsersQueryDto } from './dto/admin-users.dto';

const creatorWhere: Prisma.UserWhereInput = {
  OR: [
    { role: UserRole.CHEF },
    { creatorWallet: { isNot: null } },
    { recipes: { some: { deletedAt: null } } },
    { stories: { some: { deletedAt: null } } },
  ],
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  image: true,
  role: true,
  status: true,
  createdAt: true,
  emailVerified: true,
  creatorWallet: { select: { id: true } },
  _count: {
    select: {
      recipes: { where: { deletedAt: null } },
      stories: { where: { deletedAt: null } },
    },
  },
  adminActionsReceived: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: { action: true, reason: true, emailQueuedAt: true, createdAt: true, admin: { select: { name: true, email: true } } },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mailer: AuthMailerService,
    private readonly emailQueue: EmailQueueService,
  ) {}

  async list(query: ListAdminUsersQueryDto) {
    const kindFilter = query.kind === AdminUserKind.CREATOR
      ? creatorWhere
      : query.kind === AdminUserKind.USER
        ? { NOT: creatorWhere }
        : {};
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: { not: UserRole.ADMIN },
      ...(query.status ? { status: query.status } : {}),
      ...kindFilter,
      ...(query.search ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { username: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      data: items.map((user) => this.serializeUser(user)),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  async get(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null, role: { not: UserRole.ADMIN } },
      select: {
        ...userSelect,
        adminActionsReceived: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, action: true, reason: true, emailQueuedAt: true, createdAt: true, admin: { select: { name: true, email: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { user: this.serializeUser(user) };
  }

  async warn(adminId: string, id: string, dto: AdminUserReasonDto) {
    const user = await this.moderatableUser(adminId, id, AccountStatus.ACTIVE);
    const action = await this.prisma.adminUserModerationAction.create({
      data: { targetUserId: id, adminId, action: AdminUserModerationActionType.WARNING, reason: dto.reason },
    });
    try {
      await this.emailQueue.enqueue(
        this.mailer.buildAdminModerationEmail({ to: user.email, name: user.name, action: 'warning', reason: dto.reason }),
        { jobId: `admin-user-moderation:${action.id}` },
      );
      await this.prisma.adminUserModerationAction.update({ where: { id: action.id }, data: { emailQueuedAt: new Date() } });
    } catch {
      throw new ServiceUnavailableException('Warning was recorded, but its email could not be queued. Try sending it again later.');
    }
    await this.notifications.create({
      recipientId: id,
      actorId: adminId,
      type: 'SYSTEM',
      targetPath: '/notifications',
      payload: { title: 'CookTale warning', message: dto.reason },
      dedupeKey: `admin-warning:${action.id}`,
      force: true,
    });
    return { action: { id: action.id } };
  }

  async ban(adminId: string, id: string, dto: AdminUserReasonDto) {
    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id, status: AccountStatus.ACTIVE, deletedAt: null, role: { not: UserRole.ADMIN }, NOT: { id: adminId } },
        data: { status: AccountStatus.SUSPENDED },
      });
      if (updated.count !== 1) throw new ConflictException('Only an active non-admin account can be banned. Reload and try again.');
      await tx.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.adminUserModerationAction.create({
        data: { targetUserId: id, adminId, action: AdminUserModerationActionType.BANNED, reason: dto.reason },
      });
      return tx.user.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
    });
    return { user };
  }

  async unban(adminId: string, id: string, dto: AdminUserReasonDto) {
    const user = await this.prisma.$transaction(async (tx) => {
      const lastAction = await tx.adminUserModerationAction.findFirst({
        where: { targetUserId: id },
        orderBy: { createdAt: 'desc' },
        select: { action: true },
      });
      if (lastAction?.action !== AdminUserModerationActionType.BANNED) {
        throw new ConflictException('Only an account banned by an administrator can be unbanned here.');
      }
      const updated = await tx.user.updateMany({
        where: { id, status: AccountStatus.SUSPENDED, deletedAt: null, role: { not: UserRole.ADMIN }, NOT: { id: adminId } },
        data: { status: AccountStatus.ACTIVE },
      });
      if (updated.count !== 1) throw new ConflictException('This account is no longer available to unban. Reload and try again.');
      await tx.adminUserModerationAction.create({
        data: { targetUserId: id, adminId, action: AdminUserModerationActionType.UNBANNED, reason: dto.reason },
      });
      return tx.user.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
    });
    return { user };
  }

  private async moderatableUser(adminId: string, id: string, status: AccountStatus) {
    const user = await this.prisma.user.findFirst({
      where: { id, status, deletedAt: null, role: { not: UserRole.ADMIN }, NOT: { id: adminId } },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new ConflictException('Only an active non-admin account can receive a warning.');
    return user;
  }

  private serializeUser<T extends { role: UserRole; creatorWallet: { id: string } | null; _count: { recipes: number; stories: number } }>(user: T) {
    return {
      ...user,
      isCreator: user.role === UserRole.CHEF || Boolean(user.creatorWallet) || user._count.recipes > 0 || user._count.stories > 0,
    };
  }
}
