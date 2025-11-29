import { PrismaClient, TenantSetting } from '@prisma/client';
const prisma = new PrismaClient();

type Config = { currency_code?: string; tax_rate?: number; limits?: { intentsPerMin?: number } };
const cache = new Map<string, { cfg: Config; ts: number }>();
const TTL_MS = 60_000;

function asString(v: any, def?: string): string | undefined {
  if (v === null || v === undefined) return def;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return def;
}
function asNumber(v: any, def = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function getTenantConfig(tenantId: string): Promise<Config> {
  const now = Date.now();
  const cached = cache.get(tenantId);
  if (cached && (now - cached.ts) < TTL_MS) return cached.cfg;

  const rows: TenantSetting[] = await prisma.tenantSetting.findMany({ where: { tenant_id: tenantId } });
  const map = Object.fromEntries(rows.map((s) => [s.key, s.value]));

  const cfg: Config = {
    currency_code: asString(map.currency_code, 'USD'),
    tax_rate: asNumber(map.tax_rate, 0),
    limits: { intentsPerMin: asNumber(map.intentsPerMin, 10) }
  };

  cache.set(tenantId, { cfg, ts: now });
  return cfg;
}