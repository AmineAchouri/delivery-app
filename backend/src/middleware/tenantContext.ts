import { Request, Response, NextFunction } from 'express';

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  const raw = req.headers['x-tenant-id'];
  const tenantId = Array.isArray(raw) ? raw[0] : raw;
  if (!tenantId || typeof tenantId !== 'string') {
    return res.status(400).json({ message: 'Missing X-Tenant-ID' });
  }
  (req as any).tenantId = tenantId;
  next();
}