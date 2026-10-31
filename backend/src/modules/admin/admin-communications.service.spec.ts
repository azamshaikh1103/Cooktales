import { NotFoundException } from '@nestjs/common';
import { ContactMessageStatus } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { AdminCommunicationsService } from './admin-communications.service';

describe('AdminCommunicationsService', () => {
  it('lists contact messages newest first with pagination', async () => {
    const prisma = {
      contactMessage: { findMany: jest.fn().mockResolvedValue([{ id: 'message-1' }]), count: jest.fn().mockResolvedValue(1) },
    } as unknown as PrismaService;
    const service = new AdminCommunicationsService(prisma);

    await expect(service.listContacts({ page: 1, pageSize: 25, status: ContactMessageStatus.NEW })).resolves.toEqual({
      data: [{ id: 'message-1' }],
      pagination: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    });
    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: ContactMessageStatus.NEW },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }));
  });

  it('marks a contact message as read', async () => {
    const prisma = {
      contactMessage: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'message-1', status: ContactMessageStatus.READ }),
      },
    } as unknown as PrismaService;
    const service = new AdminCommunicationsService(prisma);

    await expect(service.updateContact('message-1', { status: ContactMessageStatus.READ })).resolves.toEqual({
      message: { id: 'message-1', status: ContactMessageStatus.READ },
    });
    expect(prisma.contactMessage.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'message-1' },
      data: expect.objectContaining({ status: ContactMessageStatus.READ, readAt: expect.any(Date) }),
    }));
  });

  it('does not pretend a missing contact message was updated', async () => {
    const prisma = { contactMessage: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) } } as unknown as PrismaService;
    const service = new AdminCommunicationsService(prisma);

    await expect(service.updateContact('missing', { status: ContactMessageStatus.CLOSED })).rejects.toBeInstanceOf(NotFoundException);
  });
});
