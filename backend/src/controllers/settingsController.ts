import { Request, Response } from 'express';
import { PrismaClient, TenantSetting } from '@prisma/client';
import { sendWithETag } from '../utils/etag';
const prisma = new PrismaClient();

export async function listSettings(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const settings = await prisma.tenantSetting.findMany({ where: { tenant_id: tenantId } });

  const map: Record<string, unknown> = {};
  let latest = new Date(0);
  for (const s of settings) {
    map[s.key] = s.value;
    if (s.updated_at.getTime() > latest.getTime()) latest = s.updated_at;
  }
  const etag = `"${settings.length ? latest.toISOString() : ''}"`;
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  res.json({ settings: map, updated_at: settings.length ? latest : null });
}

export async function getSettings(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const settings: TenantSetting[] = await prisma.tenantSetting.findMany({ where: { tenant_id: tenantId } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return sendWithETag(req, res, map, 300);
}