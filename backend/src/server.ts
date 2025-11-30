import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { RequestHandler, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { auth } from './middleware/auth';
import { tenantContext } from './middleware/tenantContext';
import { PrismaClient, Cart } from '@prisma/client';
const prisma = new PrismaClient();
import { validate } from './middleware/validate';
import { listFeatures } from './controllers/featuresController';
import { listSettings } from './controllers/settingsController';
import { listMenus, listCategories, listItemsByCategory, getItem } from './controllers/menusController';
import { menuIdParams, categoryIdParams, itemIdParams } from './schemas/menus';
import { login, refresh } from './controllers/authController';
import { checkout, getCart, addItem, updateItem, deleteItem } from './controllers/cartController';
import { listOrders, getOrder, updateOrderStatus } from './controllers/ordersController';
import { paymentWebhook, createPaymentIntent } from './controllers/paymentsController';
import { loginSchema, refreshSchema } from './schemas/auth';
import { addItemSchema, updateItemSchema } from './schemas/cart';
import { orderIdParams } from './schemas/orders';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from './config';
import { requireRole } from './middleware/requireRole';
import { createMenu, updateMenu, deleteMenu, createCategory, updateCategory, deleteCategory, createItem, updateItemAdmin, deleteItemAdmin } from './controllers/adminController';
import { errorHandler } from './middleware/errorHandler';
import { verifyHmac } from './utils/webhookVerify';
import { tenantRateLimit } from './middleware/tenantRateLimit';
import { getTenantConfig } from './services/tenantConfig';
import { getConfig } from './controllers/tenantController';
import dashboardRoutes from './routes/dashboardRoutes';
import platformAdminRoutes from './routes/platformAdmin.routes';
import tenantRoutes from './routes/tenant.routes';

const app = express();

// Raw webhook FIRST
app.post('/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const raw = req.body as Buffer;
  const sig = req.headers['x-signature'] as string | undefined;

  if (!verifyHmac(raw, sig, config.webhookSecret)) {
    return res.status(400).json({ message: 'Invalid signature' });
  }
  const event = JSON.parse(raw.toString('utf8'));
  return paymentWebhook(event, res);
});

// Auth routes
app.post('/api/auth/login', validate(loginSchema), login);
app.post('/api/auth/refresh', validate(refreshSchema), refresh);

// JSON parser AFTER webhook
app.use(express.json({ limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// Swagger docs (OpenAPI from ../openapi.yaml)
const openapi = YAML.parse(readFileSync(join(__dirname, '..', 'openapi.yaml'), 'utf8'));

// Cast swagger handlers to align with your Express types (avoids TS2769 due to type dupes)
const swaggerServe = swaggerUi.serve as unknown as RequestHandler;
const swaggerSetup = swaggerUi.setup(openapi, { explorer: true }) as unknown as RequestHandler;

app.use('/api-docs', swaggerServe, swaggerSetup);
app.get('/api-docs.json', (_req, res) => res.json(openapi));

// Trust proxy if behind a reverse proxy (optional)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Update CORS configuration
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://172.28.16.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id']
}));

// Public endpoint to list tenants for login page (no auth required)
app.get('/api/tenants/list', async (_req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        tenant_id: true,
        name: true,
        domain: true,
        status: true
      },
      orderBy: { name: 'asc' }
    });
    console.log('Found tenants:', tenants.length, tenants);
    // Return all tenants but mark inactive ones
    res.json(tenants.map((t) => ({
      id: t.tenant_id,
      name: t.name,
      domain: t.domain,
      status: t.status
    })));
  } catch (error) {
    console.error('Failed to list tenants:', error);
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

// Request logging
app.use(morgan('combined'));

// Optional: redirect /docs to where Swagger is already mounted (adjust target if needed)
app.get(['/docs', '/docs/'], (_req, res) => res.redirect(302, '/api-docs'));

// Basic rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false
}) as unknown as RequestHandler;

// Use limiter
app.use('/auth', apiLimiter);
app.use('/cart', apiLimiter);
app.use('/orders', apiLimiter);

// Apply per-tenant/user limits (tune as needed)
const rlStrict = tenantRateLimit({ windowMs: 60_000, max: 30 }); // 30 req/min

// Dynamic per-tenant limiter wrapper
function dynamicPaymentsLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'unknown';
    const cfg = await getTenantConfig(tenantId);
    return tenantRateLimit({ windowMs: 60_000, max: cfg.limits?.intentsPerMin ?? 10 })(req, res, next);
  };
}

// Payments (intent)
app.post('/payments/intents', auth, tenantContext, dynamicPaymentsLimit(), createPaymentIntent);

// Orders
app.get('/orders', auth, tenantContext, rlStrict, listOrders);
app.get('/orders/:id', auth, tenantContext, rlStrict, getOrder);
app.post('/orders/:id/status', auth, tenantContext, rlStrict, updateOrderStatus);

app.get('/health', (_req, res) => res.status(200).send('ok'));

// Health/ready endpoints
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.get('/readyz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

// Add this with other route registrations
app.use('/api/dashboard', dashboardRoutes);

// Platform admin routes (separate from tenant-scoped routes)
app.use('/api/platform-admin', platformAdminRoutes);

// Tenant routes (tenant-scoped data)
app.use('/api/tenant', tenantRoutes);

// Find tenants where user has an account (for multi-tenant login)
app.post('/api/auth/find-tenants', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find all users with this email across all tenants
    const users = await prisma.user.findMany({
      where: { email: email.toLowerCase() },
      include: {
        tenant: {
          select: {
            tenant_id: true,
            name: true,
            domain: true,
            status: true
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    // Return list of tenants where user has an account
    const tenants = users.map(u => ({
      tenant_id: u.tenant.tenant_id,
      name: u.tenant.name,
      domain: u.tenant.domain,
      status: u.tenant.status,
      roles: u.roles.map(r => r.role.name)
    }));

    res.json({ tenants });
  } catch (error) {
    console.error('Find tenants error:', error);
    res.status(500).json({ error: 'Failed to find tenants' });
  }
});

// Multi-tenant login - login to all tenants at once
app.post('/api/auth/multi-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find all users with this email
    const users = await prisma.user.findMany({
      where: { email: email.toLowerCase() },
      include: {
        tenant: {
          select: {
            tenant_id: true,
            name: true,
            domain: true,
            status: true
          }
        },
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password against the first user (same password across tenants)
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(password, users[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens for the primary tenant
    const jwt = require('jsonwebtoken');
    const primaryUser = users[0];
    
    const accessToken = jwt.sign(
      { sub: primaryUser.user_id, tenant_id: primaryUser.tenant_id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { sub: primaryUser.user_id, tenant_id: primaryUser.tenant_id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );

    // Build response with all tenants
    const tenants = users.map(u => ({
      tenant_id: u.tenant.tenant_id,
      name: u.tenant.name,
      domain: u.tenant.domain,
      status: u.tenant.status,
      user_id: u.user_id,
      roles: u.roles.map(r => r.role.name),
      permissions: u.roles.flatMap(r => r.role.permissions.map(p => p.permission.name))
    }));

    // Get permissions for primary user
    const permissions = new Set<string>();
    primaryUser.roles.forEach(r => r.role.permissions.forEach((p: any) => permissions.add(p.permission.name)));

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        user_id: primaryUser.user_id,
        email: primaryUser.email,
        phone: primaryUser.phone,
        status: primaryUser.status,
        roles: primaryUser.roles.map(r => r.role.name),
        permissions: Array.from(permissions)
      },
      tenants,
      primary_tenant: tenants[0]
    });
  } catch (error) {
    console.error('Multi-login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Auth
app.post('/auth/login', tenantContext, validate(loginSchema), login);
app.post('/auth/refresh', tenantContext, validate(refreshSchema), refresh);

// Cart
app.get('/cart', auth, tenantContext, getCart);
app.post('/cart/items', auth, tenantContext, validate(addItemSchema), addItem);
app.patch('/cart/items/:id', auth, tenantContext, validate(updateItemSchema), updateItem);
app.delete('/cart/items/:id', auth, tenantContext, deleteItem);
app.post('/orders', auth, tenantContext, checkout);

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

// Features & Settings
app.get('/features', auth, tenantContext, listFeatures);
app.get('/settings', auth, tenantContext, listSettings);

// Menus
app.get('/menus', auth, tenantContext, listMenus);
app.get('/menus/:menuId/categories', auth, tenantContext, validate(menuIdParams, 'params'), listCategories);
app.get('/categories/:categoryId/items', auth, tenantContext, validate(categoryIdParams, 'params'), listItemsByCategory);
app.get('/items/:itemId', auth, tenantContext, validate(itemIdParams, 'params'), getItem);

// Admin routes (protected)
app.post('/admin/menus', auth, tenantContext, requireRole('admin'), createMenu);
app.patch('/admin/menus/:id', auth, tenantContext, requireRole('admin'), updateMenu);
app.delete('/admin/menus/:id', auth, tenantContext, requireRole('admin'), deleteMenu);

app.post('/admin/categories', auth, tenantContext, requireRole('admin'), createCategory);
app.patch('/admin/categories/:id', auth, tenantContext, requireRole('admin'), updateCategory);
app.delete('/admin/categories/:id', auth, tenantContext, requireRole('admin'), deleteCategory);

app.post('/admin/items', auth, tenantContext, requireRole('admin'), createItem);
app.patch('/admin/items/:id', auth, tenantContext, requireRole('admin'), updateItemAdmin);
app.delete('/admin/items/:id', auth, tenantContext, requireRole('admin'), deleteItemAdmin);

// Tenant config
app.get('/tenant/config', auth, tenantContext, getConfig);

// Helper: get or create cart
async function getOrCreateCart(prisma: PrismaClient, tenantId: string, userId: string): Promise<Cart> {
  const existing = await prisma.cart.findUnique({
    where: { tenant_id_user_id: { tenant_id: tenantId, user_id: userId } }
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { tenant_id: tenantId, user_id: userId }
  });
}

// Start server
const PORT = Number(process.env.PORT ?? 3000);
const HOST = '0.0.0.0'; // <-- add this
app.use(errorHandler);
app.listen(PORT, HOST, () => {
  console.log(`API on ${HOST}:${PORT}`);
});

export default app;