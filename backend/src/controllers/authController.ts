import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, signTenantAccess, signTenantRefresh, verifyRefreshAndRotate } from '../services/auth';

const prisma = new PrismaClient();

export async function login(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { tenant_id: tenantId, email },
    include: { 
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      tenant: true
    }
  });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const perms = new Set<string>();
  const roleNames = user.roles.map(r => r.role.name);
  user.roles.forEach(r => r.role.permissions.forEach(p => perms.add(p.permission.name)));

  const access = signTenantAccess({
    sub: user.user_id,
    typ: 'tenant',
    tenant_id: tenantId,
    roles: roleNames,
    perms: Array.from(perms)
  });
  const refresh = await signTenantRefresh(user.user_id, tenantId);
  
  res.json({ 
    access_token: access, 
    refresh_token: refresh,
    tenant: {
      tenant_id: user.tenant.tenant_id,
      name: user.tenant.name,
      domain: user.tenant.domain,
      status: user.tenant.status
    }
  });
}

export async function refresh(req: Request, res: Response) {
  const rotated = await verifyRefreshAndRotate(req.body.refresh_token);
  if (!rotated) return res.status(401).json({ message: 'Invalid refresh token' });

  const user = await prisma.user.findUnique({
    where: { user_id: rotated.user_id },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  });
  if (!user || user.tenant_id !== rotated.tenant_id) return res.status(404).json({ message: 'User not found' });

  const perms = new Set<string>();
  const roleNames = user.roles.map(r => r.role.name);
  user.roles.forEach(r => r.role.permissions.forEach(p => perms.add(p.permission.name)));

  const access = signTenantAccess({
    sub: user.user_id,
    typ: 'tenant',
    tenant_id: rotated.tenant_id,
    roles: roleNames,
    perms: Array.from(perms)
  });

  res.json({ access_token: access, refresh_token: rotated.refresh_token });
}