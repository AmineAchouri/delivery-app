import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listFeatures(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const features = await prisma.tenantFeature.findMany({
    where: { tenant_id: tenantId },
    include: { feature: true }
  });
  res.json(features.map(f => ({
    key: f.feature?.feature_key ?? f.feature_id,
    enabled: f.is_enabled,
    config: f.config ?? null,
    updated_at: f.updated_at
  })));
}