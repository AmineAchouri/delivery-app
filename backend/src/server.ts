import express from 'express';
import cors from 'cors';
import { auth } from './middleware/auth';
import { tenantContext } from './middleware/tenantContext';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, signTenantAccess, signTenantRefresh, verifyRefreshAndRotate } from './services/auth';

const prisma = new PrismaClient();
const app = express();
app.use(cors());

// Debug raw body (does NOT consume it for parser)
app.use((req, _res, next) => {
  const chunks: Buffer[] = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    if (chunks.length) {
      const raw = Buffer.concat(chunks).toString();
      (req as any)._rawBody = raw; // store for reference
      console.log('RAW START TEXT:', raw.slice(0, 20));
      console.log('RAW START HEX :', Buffer.from(raw.slice(0, 20)).toString('hex'));
    }
    // Re-create readable stream for express.json()
    Object.defineProperty(req, 'push', { value: (chunk: any) => {} }); // noop
  });
  next();
});

// JSON parser AFTER raw capture
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).send('ok'));

app.post('/auth/login', tenantContext, async (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ message: 'Invalid JSON body', rawPreview: (req as any)._rawBody?.slice(0, 30) });
  }
  const { email, password } = req.body;
  const tenantId = (req as any).tenantId;
  if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

  const user = await prisma.user.findFirst({
    where: { tenant_id: tenantId, email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } }
            }
          }
        }
      }
    }
  });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const perms = new Set<string>();
  user.roles.forEach(r => r.role.permissions.forEach(rp => perms.add(rp.permission.name)));
  const roleNames = user.roles.map(r => r.role.name);

  const access = signTenantAccess({
    sub: user.user_id,
    typ: 'tenant',
    tenant_id: tenantId,
    roles: roleNames,
    perms: Array.from(perms)
  });
  const refresh = signTenantRefresh(user.user_id, tenantId);
  res.json({ access_token: access, refresh_token: refresh });
});

app.post('/auth/refresh', tenantContext, async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ message: 'Missing refresh_token' });
  const rotated = await verifyRefreshAndRotate(refresh_token);
  if (!rotated) return res.status(401).json({ message: 'Invalid refresh token' });

  // Build roles/perms for new access
  const user = await prisma.user.findUnique({
    where: { user_id: rotated.user_id },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  });
  if (!user || user.tenant_id !== rotated.tenant_id) return res.status(404).json({ message: 'User not found' });

  const perms = new Set<string>();
  user.roles.forEach(r => r.role.permissions.forEach(rp => perms.add(rp.permission.name)));
  const roleNames = user.roles.map(r => r.role.name);

  const access = signTenantAccess({
    sub: user.user_id,
    typ: 'tenant',
    tenant_id: rotated.tenant_id,
    roles: roleNames,
    perms: Array.from(perms)
  });

  res.json({ access_token: access, refresh_token: rotated.refresh_token });
});

app.get('/menus', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const menus = await prisma.menu.findMany({ where: { tenant_id: tenantId } });
  res.json(menus);
});

// Current user profile (roles + permissions)
app.get('/me', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      roles: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } }
        }
      }
    }
  });
  if (!user || user.tenant_id !== tenantId) return res.status(404).json({ message: 'User not found' });

  const perms = new Set<string>();
  const roleNames = user.roles.map(r => r.role.name);
  user.roles.forEach(r => r.role.permissions.forEach(rp => perms.add(rp.permission.name)));

  res.json({
    user_id: user.user_id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    tenant_id: user.tenant_id,
    roles: roleNames,
    perms: Array.from(perms)
  });
});

// Tenant features (merged defaults + overrides)
app.get('/features', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const [features, overrides] = await Promise.all([
    prisma.feature.findMany(),
    prisma.tenantFeature.findMany({ where: { tenant_id: tenantId } })
  ]);
  const byId = new Map(overrides.map(o => [o.feature_id, o]));
  const result = features.map(f => {
    const ov = byId.get(f.feature_id);
    return {
      feature_key: f.feature_key,
      enabled: ov ? ov.is_enabled : f.default_enabled,
      config: ov?.config ?? null,
      updated_at: ov?.updated_at ?? null
    };
  });
  // Optional ETag based on updated_at values
  const etag = `"${result.map(r => r.updated_at?.toISOString() || '').join('|')}"`;
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.json({ features: result });
});

// Tenant settings (key/value map)
app.get('/settings', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const settings = await prisma.tenantSetting.findMany({ where: { tenant_id: tenantId } });
  const map: Record<string, unknown> = {};
  let latest: Date | null = null;
  for (const s of settings) {
    map[s.key] = s.value;
    latest = !latest || s.updated_at > latest ? s.updated_at : latest;
  }
  const etag = `"${latest?.toISOString() || ''}"`;
  res.setHeader('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end();
  res.json({ settings: map, updated_at: latest });
});

// Categories under a menu
app.get('/menus/:menuId/categories', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { menuId } = req.params;
  const menu = await prisma.menu.findFirst({ where: { menu_id: menuId, tenant_id: tenantId } });
  if (!menu) return res.status(404).json({ message: 'Menu not found' });
  const cats = await prisma.menuCategory.findMany({
    where: { tenant_id: tenantId, menu_id: menuId },
    orderBy: { order_index: 'asc' }
  });
  res.json(cats);
});

// Items under a category
app.get('/categories/:categoryId/items', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { categoryId } = req.params;
  const category = await prisma.menuCategory.findFirst({ where: { category_id: categoryId, tenant_id: tenantId } });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  const items = await prisma.menuItem.findMany({
    where: { tenant_id: tenantId, category_id: categoryId, is_available: true },
    orderBy: { name: 'asc' }
  });
  res.json(items);
});

// Item detail
app.get('/items/:itemId', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const { itemId } = req.params;
  const item = await prisma.menuItem.findFirst({
    where: { item_id: itemId, tenant_id: tenantId }
  });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

app.listen(3000, '0.0.0.0', () => console.log('API listening on 3000'));