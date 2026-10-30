import type { EmailQueueService } from '../auth/mailer/email-queue.service';
import { AdminOperationsService } from './admin-operations.service';

describe('AdminOperationsService', () => {
  it('returns queue counts without exposing email recipients or message contents', async () => {
    const emailQueue = {
      getStats: jest.fn().mockResolvedValue({ waiting: 2, active: 1, delayed: 0, failed: 3 }),
    } as unknown as EmailQueueService;

    const service = new AdminOperationsService(emailQueue);

    await expect(service.overview()).resolves.toEqual({
      emailQueue: { waiting: 2, active: 1, delayed: 0, failed: 3 },
    });
  });
});
