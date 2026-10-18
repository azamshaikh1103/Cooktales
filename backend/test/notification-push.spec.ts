jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({ addBulk: jest.fn(), close: jest.fn() })),
  Worker: jest.fn(),
}));

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
}));

import { AccountStatus, NotificationType } from '@prisma/client';
import webpush from 'web-push';
import { NotificationPushService } from '../src/modules/notifications/notification-push.service';

const configuredValues: Record<string, unknown> = {
  APP_MODE: 'api',
  NOTIFICATION_PUSH_ENABLED: true,
  VAPID_SUBJECT: 'mailto:hello@cooktale.in',
  VAPID_PUBLIC_KEY: 'public-key',
  VAPID_PRIVATE_KEY: 'private-key',
  REDIS_URL: 'redis://127.0.0.1:6379',
  FRONTEND_URL: 'http://localhost:3000',
};

describe('NotificationPushService', () => {
  const config = { get: jest.fn((key: string) => configuredValues[key]) };
  const prisma = {
    pushSubscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    notification: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.pushSubscription.findUnique.mockResolvedValue({
      id: 'subscription-1',
      endpoint: 'https://push.example.test/subscription-1',
      p256dh: 'p256dh',
      auth: 'auth',
      user: {
        id: 'user-1',
        status: AccountStatus.ACTIVE,
        deletedAt: null,
        notificationPreferences: { push_activity: true },
      },
    });
    prisma.notification.findFirst.mockResolvedValue({
      id: 'notification-1',
      type: NotificationType.FOLLOW,
      targetPath: '/profile/chef',
      payload: {},
      actor: { name: 'Chef' },
    });
  });

  it('does not send browser alerts when the user turns them off', async () => {
    prisma.pushSubscription.findUnique.mockResolvedValueOnce({
      id: 'subscription-1',
      endpoint: 'https://push.example.test/subscription-1',
      p256dh: 'p256dh',
      auth: 'auth',
      user: {
        id: 'user-1',
        status: AccountStatus.ACTIVE,
        deletedAt: null,
        notificationPreferences: { push_activity: false },
      },
    });
    const service = new NotificationPushService(config as never, prisma as never);

    await (service as any).deliver({ notificationId: 'notification-1', subscriptionId: 'subscription-1' });

    expect(webpush.sendNotification).not.toHaveBeenCalled();
    expect(prisma.notification.findFirst).not.toHaveBeenCalled();
  });

  it('removes expired browser subscriptions instead of retrying them forever', async () => {
    (webpush.sendNotification as jest.Mock).mockRejectedValueOnce({ statusCode: 410 });
    const service = new NotificationPushService(config as never, prisma as never);

    await (service as any).deliver({ notificationId: 'notification-1', subscriptionId: 'subscription-1' });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://push.example.test/subscription-1' }),
      expect.stringContaining('Chef started following your kitchen.'),
      expect.objectContaining({ TTL: 86_400 }),
    );
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { id: 'subscription-1', endpoint: 'https://push.example.test/subscription-1' },
    });
  });

  it('uses a BullMQ-safe job ID when queuing a browser alert', async () => {
    prisma.notification.findUnique.mockResolvedValueOnce({ recipientId: 'user-1' });
    prisma.pushSubscription.findMany.mockResolvedValueOnce([{ id: 'subscription-1' }]);
    const service = new NotificationPushService(config as never, prisma as never);
    const addBulk = (service as any).queue.addBulk as jest.Mock;

    await service.enqueueForNotification('notification-1');

    expect(addBulk).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'deliver',
        data: { notificationId: 'notification-1', subscriptionId: 'subscription-1' },
        opts: expect.objectContaining({
          jobId: 'notification-notification-1-subscription-subscription-1',
        }),
      }),
    ]);
  });
});
