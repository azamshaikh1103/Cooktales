import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactMessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ListAdminContactMessagesQueryDto,
  ListAdminNewsletterSubscribersQueryDto,
  UpdateAdminContactMessageDto,
} from './dto/admin-communications.dto';

@Injectable()
export class AdminCommunicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listContacts(query: ListAdminContactMessagesQueryDto) {
    const where: Prisma.ContactMessageWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { subject: { contains: query.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const [data, totalItems] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return this.paginate(data, query, totalItems);
  }

  async updateContact(id: string, dto: UpdateAdminContactMessageDto) {
    const data: Prisma.ContactMessageUpdateManyMutationInput = {
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote || null } : {}),
      ...(dto.status === ContactMessageStatus.READ ? { readAt: new Date() } : {}),
      ...(dto.status === ContactMessageStatus.CLOSED ? { closedAt: new Date() } : {}),
    };
    const updated = await this.prisma.contactMessage.updateMany({ where: { id }, data });
    if (updated.count !== 1) throw new NotFoundException('Contact message not found');
    return { message: await this.prisma.contactMessage.findUniqueOrThrow({ where: { id } }) };
  }

  async listNewsletterSubscribers(query: ListAdminNewsletterSubscribersQueryDto) {
    const where: Prisma.NewsletterSubscriberWhereInput = {
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      ...(query.search ? { email: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, totalItems] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: { id: true, email: true, isActive: true, source: true, confirmedAt: true, unsubscribedAt: true, createdAt: true },
      }),
      this.prisma.newsletterSubscriber.count({ where }),
    ]);
    return this.paginate(data, query, totalItems);
  }

  private paginate<T>(data: T[], query: { page: number; pageSize: number }, totalItems: number) {
    return { data, pagination: { page: query.page, pageSize: query.pageSize, totalItems, totalPages: Math.ceil(totalItems / query.pageSize) } };
  }
}
