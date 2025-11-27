import express from 'express';
import cors from 'cors';
import { auth } from './middleware/auth';
import { tenantContext } from './middleware/tenantContext';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, signTenantAccess, signTenantRefresh } from './services/auth';

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

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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

app.get('/menus', auth, tenantContext, async (req, res) => {
  const tenantId = (req as any).tenantId;
  const menus = await prisma.menu.findMany({ where: { tenant_id: tenantId } });
  res.json(menus);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on ${port}`));