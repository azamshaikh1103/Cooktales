import { AuthMailerService } from '../src/modules/auth/mailer/auth-mailer.service';
import { EmailUnsubscribeService } from '../src/modules/auth/mailer/email-unsubscribe.service';

const values: Record<string, string> = {
  FRONTEND_URL: 'https://www.cooktale.test',
  PUBLIC_API_URL: 'https://api.cooktale.test/api/v1',
  EMAIL_UNSUBSCRIBE_SECRET: 'test-email-unsubscribe-secret',
};

describe('CookTale email layout', () => {
  const config = { get: jest.fn((key: string) => values[key]) };
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the shared brand footer and a daily digest unsubscribe link', () => {
    const unsubscribe = new EmailUnsubscribeService(config as never, prisma as never);
    const mailer = new AuthMailerService(config as never, unsubscribe);

    const email = mailer.buildNotificationDigestEmail({
      recipientId: 'user-1',
      to: 'chef@example.test',
      recipientName: 'Chef',
      total: 1,
      items: [{ text: 'Someone followed you.', targetPath: '/notifications' }],
    });

    expect(email.html).toContain('CookTale</a>');
    expect(email.html).toContain('border-radius:8px;background:#006C5E');
    expect(email.html).toContain('facebook.com/cooktale.in');
    expect(email.html).toContain('CookTale for iOS and Android is coming soon.');
    expect(email.html).toContain('Unsubscribe</a>');
    expect(email.html).toContain('https://api.cooktale.test/api/v1/email-preferences/unsubscribe?token=');
  });

  it('turns off only daily digest email preferences for a valid unsubscribe link', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      notificationPreferences: { push_activity: true, email_activity_digest: true },
    });
    prisma.user.update.mockResolvedValueOnce({});
    const unsubscribe = new EmailUnsubscribeService(config as never, prisma as never);
    const token = new URL(unsubscribe.createDailyDigestUrl('user-1')).searchParams.get('token');

    await unsubscribe.unsubscribeDailyDigest(token!);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        notificationPreferences: {
          push_activity: true,
          email_activity_digest: false,
          email_digest: false,
        },
      },
    });
  });

  it('rejects a changed unsubscribe token', async () => {
    const unsubscribe = new EmailUnsubscribeService(config as never, prisma as never);
    const token = unsubscribe.createDailyDigestUrl('user-1').split('token=')[1]!;

    await expect(unsubscribe.unsubscribeDailyDigest(`${token}changed`)).rejects.toThrow('Invalid unsubscribe link');
  });

});
