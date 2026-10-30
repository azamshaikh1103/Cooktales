import { Injectable } from '@nestjs/common';
import { EmailQueueService } from '../auth/mailer/email-queue.service';

@Injectable()
export class AdminOperationsService {
  constructor(private readonly emailQueue: EmailQueueService) {}

  async overview() {
    return { emailQueue: await this.emailQueue.getStats() };
  }
}
