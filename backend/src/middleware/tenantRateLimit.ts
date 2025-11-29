import { Request, Response, NextFunction } from 'express';

type Key = string;
type Bucket = { tokens: number; lastRefill: number };
const store = new Map<Key, Bucket>();

export function tenantRateLimit(opts: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'unknown';
    const userId = (req as any).user?.sub ?? 'anon';
    const key = `${tenantId}:${userId}:${req.path}`;

    const bucket = store.get(key) ?? { tokens: opts.max, lastRefill: now };
    if (now - bucket.lastRefill >= opts.windowMs) {
      bucket.tokens = opts.max;
      bucket.lastRefill = now;
    }

    res.setHeader('X-RateLimit-Limit', String(opts.max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(bucket.tokens - 1, 0)));
    res.setHeader('X-RateLimit-Reset', String(bucket.lastRefill + opts.windowMs));

    if (bucket.tokens <= 0) {
      store.set(key, bucket);
      return res.status(429).json({ message: 'Too Many Requests' });
    }

    bucket.tokens -= 1;
    store.set(key, bucket);
    next();
  };
}