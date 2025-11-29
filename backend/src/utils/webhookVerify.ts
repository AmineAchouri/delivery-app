import crypto from 'crypto';

export function verifyHmac(raw: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature || !secret) return false;

  const expectedHex = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const expectedBase64 = crypto.createHmac('sha256', secret).update(raw).digest('base64');

  // Normalize provided signature
  const sig = signature.trim();

  // Try hex match
  const hexOk = safeEqual(sig, expectedHex);
  // Try base64 match
  const b64Ok = safeEqual(sig, expectedBase64);

  return hexOk || b64Ok;
}

function safeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}