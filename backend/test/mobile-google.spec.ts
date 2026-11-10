import { AccountStatus } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from '../src/modules/auth/auth.service';
import { MobileAuthController } from '../src/modules/auth/mobile-auth.controller';

describe('mobile Google sign-in', () => {
  const user = { id: '1', email: 'user@gmail.com', name: 'User', username: 'user', image: null, role: 'USER', isPro: false, surveyCompleted: true, status: AccountStatus.ACTIVE, deletedAt: null };
  const prisma = { oAuthAccount: { findUnique: jest.fn(), create: jest.fn() }, user: { findUnique: jest.fn(), create: jest.fn() }, authSession: { create: jest.fn() } };
  const config = { get: jest.fn((key: string) => key === 'GOOGLE_CLIENT_ID' ? 'web-client' : 30) };
  const jwt = { signAsync: jest.fn().mockResolvedValue('access') };
  const rate = { checkGoogle: jest.fn() };
  const service = new AuthService(prisma as never, jwt as never, config as never, {} as never, {} as never, {} as never, rate as never, {} as never);

  beforeEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); prisma.oAuthAccount.findUnique.mockResolvedValue({ user }); });

  it('verifies the Google token before issuing a session for an active account', async () => {
    const verify = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({ getPayload: () => ({ sub: 'google-id', email: 'user@gmail.com', email_verified: true }) } as never);
    const result = await service.mobileGoogleSignIn('signed-google-token', {});
    expect(verify).toHaveBeenCalledWith({ idToken: 'signed-google-token', audience: 'web-client' });
    expect(result).toMatchObject({ accessToken: 'access', user: { id: '1' } });
    expect(result.refreshToken).toBeTruthy();
  });

  it('rejects invalid Google tokens without creating a session', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation((() => Promise.reject(new Error('invalid'))) as never);
    await expect(service.mobileGoogleSignIn('bad-token', {})).rejects.toThrow();
    expect(prisma.authSession.create).not.toHaveBeenCalled();
  });

  it('rejects inactive accounts', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({ getPayload: () => ({ sub: 'google-id', email: 'user@gmail.com', email_verified: true }) } as never);
    prisma.oAuthAccount.findUnique.mockResolvedValue({ user: { ...user, deletedAt: new Date() } });
    await expect(service.mobileGoogleSignIn('signed-google-token', {})).rejects.toThrow();
    expect(prisma.authSession.create).not.toHaveBeenCalled();
  });

  it('links an existing Gmail account to its verified Google identity', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({ getPayload: () => ({ sub: 'google-id', email: 'user@gmail.com', email_verified: true }) } as never);
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(user);
    await service.mobileGoogleSignIn('signed-google-token', {});
    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: '1', providerAccountId: 'google-id' }) });
  });

  it('creates a CookTale account for a new verified Google user', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({ getPayload: () => ({ sub: 'google-id', email: 'new@gmail.com', email_verified: true, name: 'New User' }) } as never);
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);
    await service.mobileGoogleSignIn('signed-google-token', {});
    expect(prisma.user.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: 'new@gmail.com', name: 'New User' }) });
    expect(prisma.oAuthAccount.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: '1', providerAccountId: 'google-id' }) });
  });

  it('does not automatically link an existing non-Google email account', async () => {
    jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({ getPayload: () => ({ sub: 'google-id', email: 'user@example.com', email_verified: true }) } as never);
    prisma.oAuthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(user);
    await expect(service.mobileGoogleSignIn('signed-google-token', {})).rejects.toThrow();
    expect(prisma.oAuthAccount.create).not.toHaveBeenCalled();
  });
});

describe('mobile authentication endpoints', () => {
  it('rejects browser-origin requests', () => {
    const controller = new MobileAuthController({} as AuthService);
    expect(() => controller.google({ idToken: 'token' }, { headers: { origin: 'https://example.com' } } as never)).toThrow();
  });

  it('refreshes only the token in the request body, never a browser cookie', () => {
    const refresh = jest.fn();
    const controller = new MobileAuthController({ refresh } as unknown as AuthService);
    controller.refresh({ refreshToken: 'mobile-token' }, { headers: { cookie: 'refreshToken=browser-token' } } as never);
    expect(refresh).toHaveBeenCalledWith('mobile-token', expect.anything());
  });
});
