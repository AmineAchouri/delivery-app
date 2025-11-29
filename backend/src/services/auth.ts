import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

// Resolve key content from env var or file path
function readKeyFromEnvOrFile(envVarContent: string, envVarPath: string, defaultFileName: string) {
  const content = (process.env[envVarContent] || '').replace(/\\n/g, '\n').trim();
  if (content) return content;
  const relPath = (process.env[envVarPath] || '').trim();
  const filePath = relPath
    ? path.resolve(process.cwd(), relPath) // resolve relative to current working dir
    : path.resolve(__dirname, '..', 'keys', defaultFileName);
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8').trim();
  console.error(`JWT key file not found at: ${filePath}`);
  return '';
}

const PRIVATE_KEY = readKeyFromEnvOrFile('JWT_PRIVATE_KEY', 'JWT_PRIVATE_KEY_FILE', 'jwt_private.pem');
const PUBLIC_KEY  = readKeyFromEnvOrFile('JWT_PUBLIC_KEY', 'JWT_PUBLIC_KEY_FILE', 'jwt_public.pem');

function ensureKeys() {
  if (!PRIVATE_KEY || !PUBLIC_KEY) {
    console.error('JWT keys missing. Provide JWT_PRIVATE_KEY/JWT_PUBLIC_KEY or JWT_PRIVATE_KEY_FILE/JWT_PUBLIC_KEY_FILE.');
    throw new Error('JWT keys missing');
  }
}

const TOKEN_ISS = process.env.TOKEN_ISS || 'delivery-app';
const TOKEN_AUD_TENANT = process.env.TOKEN_AUD_TENANT || 'tenant-api';
const ACCESS_TTL_SECONDS = Number(process.env.ACCESS_TTL_SECONDS || 900);

export function signTenantAccess(payload: {
  sub: string;
  typ: 'tenant';
  tenant_id: string;
  roles: string[];
  perms: string[];
}) {
  ensureKeys();
  return jwt.sign(payload, PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: ACCESS_TTL_SECONDS,
    issuer: TOKEN_ISS,
    audience: TOKEN_AUD_TENANT
  });
}

export function signTenantRefresh(userId: string, tenantId: string) {
  const token = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  return prisma.refreshToken.create({
    data: { user_id: userId, tenant_id: tenantId, token_hash: hash }
  }).then(() => token);
}

export async function verifyRefreshAndRotate(refreshToken: string) {
  const hash = createHash('sha256').update(refreshToken).digest('hex');
  const existing = await prisma.refreshToken.findFirst({ where: { token_hash: hash, revoked_at: null } });
  if (!existing) return null;
  await prisma.refreshToken.update({
    where: { refresh_token_id: existing.refresh_token_id },
    data: { revoked_at: new Date() }
  });
  const newToken = randomBytes(32).toString('hex');
  const newHash = createHash('sha256').update(newToken).digest('hex');
  await prisma.refreshToken.create({
    data: { user_id: existing.user_id, tenant_id: existing.tenant_id, token_hash: newHash }
  });
  return { user_id: existing.user_id, tenant_id: existing.tenant_id, refresh_token: newToken };
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}