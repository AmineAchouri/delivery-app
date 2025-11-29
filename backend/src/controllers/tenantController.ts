import { Request, Response } from 'express';
import { getTenantConfig } from '../services/tenantConfig';

export async function getConfig(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const cfg = await getTenantConfig(tenantId);
  res.json(cfg);
}