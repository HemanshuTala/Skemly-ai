import crypto from 'crypto';

export function isValidRazorpaySignature(
  payload: string | Buffer,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret || !/^[a-f\d]{64}$/i.test(signature)) {
    return false;
  }

  const providedSignature = Buffer.from(signature, 'hex');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest();

  return crypto.timingSafeEqual(providedSignature, expectedSignature);
}
