import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { EmailQueueService } from '../auth/mailer/email-queue.service';
import { SendContactMessageDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  async send(dto: SendContactMessageDto) {
    const name = this.escape(dto.name.trim());
    const email = dto.email.trim().toLowerCase();
    const subject = this.escape(dto.subject.trim());
    const rawMessage = dto.message.trim();
    const message = this.escape(rawMessage).replace(/\n/g, '<br/>');

    await this.prisma.contactMessage.create({
      data: { name: dto.name.trim(), email, subject: dto.subject.trim(), message: rawMessage },
    });

    try {
      await this.emailQueue.enqueue({
        to: this.config.get('CONTACT_EMAIL_TO', { infer: true }),
        subject: `[CookTale contact] ${subject}`,
        html: `<p><strong>From:</strong> ${name} (${this.escape(email)})</p><p>${message}</p>`,
      });
    } catch {
      // The message is already safely stored in the admin inbox.
    }
    return { success: true, message: 'Message sent successfully!' };
  }

  private escape(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
  }
}
