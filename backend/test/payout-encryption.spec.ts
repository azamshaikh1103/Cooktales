import { ServiceUnavailableException } from '@nestjs/common';
import { PayoutEncryptionService } from '../src/modules/studio/payout-encryption.service';

describe('PayoutEncryptionService', () => {
  it('encrypts payout details without returning the original value', () => {
    const service = new PayoutEncryptionService({
      get: jest.fn().mockReturnValue('a'.repeat(64)),
    } as never);

    const encrypted = service.encrypt('creator@example.com');

    expect(encrypted).not.toContain('creator@example.com');
    expect(service.decrypt(encrypted)).toBe('creator@example.com');
  });

  it('refuses to save payout details when the encryption key is unavailable', () => {
    const service = new PayoutEncryptionService({
      get: jest.fn().mockReturnValue(undefined),
    } as never);

    expect(() => service.encrypt('creator@example.com')).toThrow(ServiceUnavailableException);
  });
});
