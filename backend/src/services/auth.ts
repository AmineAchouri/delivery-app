import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtClaims } from '../types/jwt';

function normalizePem(v?: string) {
  return (v || '').replace(/\\n/g, '\n').trim();
}
const PRIVATE_KEY = normalizePem(process.env.JWT_PRIVATE_KEY);
const PUBLIC_KEY  = normalizePem(process.env.JWT_PUBLIC_KEY);

const ISS = process.env.TOKEN_ISS || 'delivery-app';
const AUD_TENANT = process.env.TOKEN_AUD_TENANT || 'tenant-api';
const ACCESS_TTL = Number(process.env.ACCESS_TTL_SECONDS || 900);
const REFRESH_TTL = Number(process.env.REFRESH_TTL_SECONDS || 2592000);

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signTenantAccess(claims: Omit<JwtClaims, 'iat' | 'exp'>) {
  if (!PRIVATE_KEY.startsWith('-----BEGIN')) throw new Error('Invalid PRIVATE_KEY');
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = { ...claims, iat: now, exp: now + ACCESS_TTL };
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', issuer: ISS, audience: AUD_TENANT });
}

export function signTenantRefresh(sub: string, tenant_id: string) {
  if (!PRIVATE_KEY.startsWith('-----BEGIN')) throw new Error('Invalid PRIVATE_KEY');
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub, typ: 'tenant', tenant_id, iat: now, exp: now + REFRESH_TTL, refresh: true } as any;
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256', issuer: ISS, audience: AUD_TENANT });
}