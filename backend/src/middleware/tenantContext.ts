import { Request, Response, NextFunction } from 'express';
import { REQUIRED_TENANT_HEADER } from '@delivery/shared';

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.header(REQUIRED_TENANT_HEADER);
  if (!tenantId) return res.status(400).json({ message: 'X-Tenant-ID header required' });
  // Basic UUID format check
  if (!/^[0-9a-fA-F-]{36}$/.test(tenantId)) {
    return res.status(400).json({ message: 'Invalid tenant id format' });
  }
  (req as any).tenantId = tenantId;
  next();
}