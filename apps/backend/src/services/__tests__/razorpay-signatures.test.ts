import crypto from 'crypto';
import { isValidRazorpaySignature } from '../razorpay-signatures';

describe('isValidRazorpaySignature', () => {
  const secret = 'test-api-secret';
  const payload = 'payment_123|subscription_456';

  function sign(value: string, signingSecret = secret): string {
    return crypto.createHmac('sha256', signingSecret).update(value).digest('hex');
  }

  it('accepts a valid signature', () => {
    expect(isValidRazorpaySignature(payload, sign(payload), secret)).toBe(true);
  });

  it('rejects a signature generated with another secret', () => {
    expect(isValidRazorpaySignature(payload, sign(payload, 'webhook-secret'), secret)).toBe(false);
  });

  it('rejects a modified payload', () => {
    expect(isValidRazorpaySignature(`${payload}|changed`, sign(payload), secret)).toBe(false);
  });

  it.each([undefined, '', 'not-a-signature'])('rejects malformed or missing signatures', (signature) => {
    expect(isValidRazorpaySignature(payload, signature, secret)).toBe(false);
  });

  it('rejects an empty secret', () => {
    expect(isValidRazorpaySignature(payload, sign(payload), '')).toBe(false);
  });
});
