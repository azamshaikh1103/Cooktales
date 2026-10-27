import { NewsletterService } from '../src/modules/newsletter/newsletter.service';

describe('NewsletterService', () => {
  const prisma = {
    newsletterSubscriber: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const emailUnsubscribe = { createNewsletterUrl: jest.fn(), unsubscribeNewsletter: jest.fn() };
  const rateLimit = { checkSignup: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    prisma.newsletterSubscriber.upsert.mockResolvedValue({ id: 'subscriber-1' });
  });

  function createService() {
    return new NewsletterService(
      prisma as never,
      emailUnsubscribe as never,
      rateLimit as never,
    );
  }

  it('creates an active subscriber immediately', async () => {
    const service = createService();

    await expect(
      service.subscribe({ email: 'chef@example.test' }, { ip: '127.0.0.1' } as never),
    ).resolves.toEqual({ accepted: true, message: 'You are subscribed to CookTale.' });

    expect(rateLimit.checkSignup).toHaveBeenCalledWith('chef@example.test', '127.0.0.1');
    expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'chef@example.test' },
        create: expect.objectContaining({
          email: 'chef@example.test',
          isActive: true,
          source: 'footer',
          confirmedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('does not change an already active subscriber', async () => {
    prisma.newsletterSubscriber.findUnique.mockResolvedValueOnce({ id: 'subscriber-1', isActive: true });
    const service = createService();

    await service.subscribe({ email: 'chef@example.test' }, { ip: '127.0.0.1' } as never);

    expect(prisma.newsletterSubscriber.upsert).not.toHaveBeenCalled();
  });

  it('delegates unsubscribe safely', async () => {
    const service = createService();

    await service.unsubscribe('signed-unsubscribe-token');
    expect(emailUnsubscribe.unsubscribeNewsletter).toHaveBeenCalledWith('signed-unsubscribe-token');
  });
});
