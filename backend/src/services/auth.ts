import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PRIVATE_KEY = (process.env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
const PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n').trim();

export function signTenantAccess(payload: {
  sub: string;
  typ: 'tenant';
  tenant_id: string;
  roles: string[];
  perms: string[];
}) {
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', expiresIn: '15m' });
}

export function signTenantRefresh(userId: string, tenantId: string) {
  const token = crypto.randomBytes(32).toString('hex'); // opaque refresh
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return prisma.refreshToken.create({
    data: { user_id: userId, tenant_id: tenantId, token_hash: hash }
  }).then(() => token);
}

export async function verifyRefreshAndRotate(refreshToken: string) {
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const existing = await prisma.refreshToken.findFirst({ where: { token_hash: hash, revoked_at: null } });
  if (!existing) return null;
  // rotate: revoke old, issue new
  await prisma.refreshToken.update({ where: { refresh_token_id: existing.refresh_token_id }, data: { revoked_at: new Date() } });
  const newToken = crypto.randomBytes(32).toString('hex');
  const newHash = crypto.createHash('sha256').update(newToken).digest('hex');
  await prisma.refreshToken.create({ data: { user_id: existing.user_id, tenant_id: existing.tenant_id, token_hash: newHash } });
  return { user_id: existing.user_id, tenant_id: existing.tenant_id, refresh_token: newToken };
}

export async function verifyPassword(plain: string, hash: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(plain, hash);
}