export const RAZORPAY_KEY_CONFIG_ERROR =
  'Payments are not configured. Please contact support.';

export function getRazorpayKeyId(): string | null {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
  return keyId || null;
}
