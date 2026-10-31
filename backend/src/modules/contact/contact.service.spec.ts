import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../database/prisma.service';
import type { AppConfig } from '../../config/env.validation';
import type { EmailQueueService } from '../auth/mailer/email-queue.service';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  it('stores the original contact message before notifying the inbox email', async () => {
    const prisma = { contactMessage: { create: jest.fn().mockResolvedValue({ id: 'message-1' }) } } as unknown as PrismaService;
    const emailQueue = { enqueue: jest.fn().mockResolvedValue(undefined) } as unknown as EmailQueueService;
    const config = { get: jest.fn().mockReturnValue('support@cooktale.in') } as unknown as ConfigService<AppConfig, true>;
    const service = new ContactService(emailQueue, config, prisma);

    await expect(service.send({ name: ' Ada ', email: 'ADA@EXAMPLE.COM ', subject: ' Hello ', message: 'First line\nSecond line' })).resolves.toEqual({
      success: true,
      message: 'Message sent successfully!',
    });
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: { name: 'Ada', email: 'ada@example.com', subject: 'Hello', message: 'First line\nSecond line' },
    });
    expect(emailQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({ to: 'support@cooktale.in' }));
  });
});
