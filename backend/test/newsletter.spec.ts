import { NewsletterService } from '../src/modules/newsletter/newsletter.service';

const values: Record<string, number | string> = {
  NEWSLETTER_CONFIRMATION_TTL_HOURS: 24,
  PUBLIC_API_URL: 'https://api.cooktale.test/api/v1',
};

describe('NewsletterService', () => {
  const config = { get: jest.fn((key: string) => values[key]) };
  const prisma = {
    newsletterSubscriber: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const mailer = {
    buildNewsletterConfirmationEmail: jest.fn(),
  };
  const emailQueue = { enqueue: jest.fn() };
  const emailUnsubscribe = { createNewsletterUrl: jest.fn(), unsubscribeNewsletter: jest.fn() };
  const rateLimit = { checkSignup: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    prisma.newsletterSubscriber.upsert.mockResolvedValue({ id: 'subscriber-1' });
    mailer.buildNewsletterConfirmationEmail.mockReturnValue({
      to: 'chef@example.test',
      subject: 'Confirm your CookTale newsletter subscription',
      html: '<a>Confirm</a>',
    });
    emailUnsubscribe.createNewsletterUrl.mockReturnValue('https://api.cooktale.test/unsubscribe');
    emailQueue.enqueue.mockResolvedValue(undefined);
  });

  function createService() {
    return new NewsletterService(
      config as never,
      prisma as never,
      mailer as never,
      emailQueue as never,
      emailUnsubscribe as never,
      rateLimit as never,
    );
  }

  it('creates a pending subscriber and queues a confirmation email with no raw token in the database', async () => {
    const service = createService();

    await expect(
      service.subscribe({ email: 'chef@example.test' }, { ip: '127.0.0.1' } as never),
    ).resolves.toEqual({ accepted: true, message: 'Check your inbox to confirm your subscription.' });

    expect(rateLimit.checkSignup).toHaveBeenCalledWith('chef@example.test', '127.0.0.1');
    expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'chef@example.test' },
        create: expect.objectContaining({
          email: 'chef@example.test',
          isActive: false,
          source: 'footer',
          confirmationTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      }),
    );
    expect(mailer.buildNewsletterConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'chef@example.test',
        confirmationUrl: expect.stringContaining('/newsletter/subscriptions/confirm?token='),
      }),
    );
    expect(emailQueue.enqueue).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ jobId: expect.stringContaining('newsletter-confirm:subscriber-1:') }),
    );
  });

  it('does not send another email when the address is already active', async () => {
    prisma.newsletterSubscriber.findUnique.mockResolvedValueOnce({ id: 'subscriber-1', isActive: true });
    const service = createService();

    await service.subscribe({ email: 'chef@example.test' }, { ip: '127.0.0.1' } as never);

    expect(prisma.newsletterSubscriber.upsert).not.toHaveBeenCalled();
    expect(emailQueue.enqueue).not.toHaveBeenCalled();
  });

  it('activates only an unexpired confirmation token and delegates unsubscribe safely', async () => {
    prisma.newsletterSubscriber.updateMany.mockResolvedValueOnce({ count: 1 });
    const service = createService();

    await service.confirm('raw-confirmation-token');
    expect(prisma.newsletterSubscriber.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ confirmationTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) }),
        data: expect.objectContaining({ isActive: true, confirmationTokenHash: null }),
      }),
    );

    await service.unsubscribe('signed-unsubscribe-token');
    expect(emailUnsubscribe.unsubscribeNewsletter).toHaveBeenCalledWith('signed-unsubscribe-token');
  });
});
