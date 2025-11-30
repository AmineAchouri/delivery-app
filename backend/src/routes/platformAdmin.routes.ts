import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

// Types
interface PlatformAdminPayload {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'PLATFORM_ADMIN';
  type: 'platform_admin';
}

interface AuthenticatedRequest extends Request {
  platformAdmin?: PlatformAdminPayload;
}

// Middleware to verify platform admin JWT
export const verifyPlatformAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as PlatformAdminPayload;

    if (decoded.type !== 'platform_admin') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Verify admin still exists and is active
    const admin = await prisma.platformAdmin.findUnique({
      where: { admin_id: decoded.adminId }
    });

    if (!admin || admin.status !== 'active') {
      return res.status(401).json({ error: 'Admin not found or inactive' });
    }

    req.platformAdmin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to require SUPER_ADMIN role
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.platformAdmin?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Helper to generate tokens
const generateTokens = async (admin: { admin_id: string; email: string; role: string }) => {
  const payload: PlatformAdminPayload = {
    adminId: admin.admin_id,
    email: admin.email,
    role: admin.role as 'SUPER_ADMIN' | 'PLATFORM_ADMIN',
    type: 'platform_admin'
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Generate refresh token
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.platformAdminRefreshToken.create({
    data: {
      admin_id: admin.admin_id,
      token_hash: refreshTokenHash,
      expires_at: expiresAt
    }
  });

  return { accessToken, refreshToken, expiresAt };
};

// ============ AUTH ROUTES ============

// POST /platform-admin/auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = await prisma.platformAdmin.findUnique({
      where: { email },
      include: {
        assignedTenants: {
          include: { tenant: true }
        }
      }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (admin.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = await generateTokens(admin);

    // Get accessible tenants with features
    let tenants;
    if (admin.role === 'SUPER_ADMIN') {
      const allTenants = await prisma.tenant.findMany({
        include: {
          features: {
            include: { feature: true }
          }
        }
      });
      tenants = allTenants.map(t => ({
        tenant_id: t.tenant_id,
        name: t.name,
        domain: t.domain,
        status: t.status,
        features: t.features.map(tf => ({
          key: tf.feature.feature_key,
          enabled: tf.is_enabled,
          description: tf.feature.description
        }))
      }));
    } else {
      // For platform admins, get features for their assigned tenants
      const assignedTenantIds = admin.assignedTenants.map(at => at.tenant.tenant_id);
      const tenantsWithFeatures = await prisma.tenant.findMany({
        where: { tenant_id: { in: assignedTenantIds } },
        include: {
          features: {
            include: { feature: true }
          }
        }
      });
      tenants = tenantsWithFeatures.map(t => ({
        tenant_id: t.tenant_id,
        name: t.name,
        domain: t.domain,
        status: t.status,
        features: t.features.map(tf => ({
          key: tf.feature.feature_key,
          enabled: tf.is_enabled,
          description: tf.feature.description
        }))
      }));
    }

    res.json({
      admin: {
        id: admin.admin_id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      tenants,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /platform-admin/auth/refresh
router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const storedToken = await prisma.platformAdminRefreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { admin: true }
    });

    if (!storedToken || storedToken.revoked_at || storedToken.expires_at < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    if (storedToken.admin.status !== 'active') {
      return res.status(401).json({ error: 'Admin account is not active' });
    }

    // Revoke old token
    await prisma.platformAdminRefreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() }
    });

    // Generate new tokens
    const tokens = await generateTokens(storedToken.admin);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /platform-admin/auth/logout
router.post('/auth/logout', verifyPlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Revoke all refresh tokens for this admin
    await prisma.platformAdminRefreshToken.updateMany({
      where: {
        admin_id: req.platformAdmin!.adminId,
        revoked_at: null
      },
      data: { revoked_at: new Date() }
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /platform-admin/auth/me
router.get('/auth/me', verifyPlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = await prisma.platformAdmin.findUnique({
      where: { admin_id: req.platformAdmin!.adminId },
      include: {
        assignedTenants: {
          include: { tenant: true }
        }
      }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    let tenants;
    if (admin.role === 'SUPER_ADMIN') {
      tenants = await prisma.tenant.findMany({
        select: { tenant_id: true, name: true, domain: true, status: true }
      });
    } else {
      tenants = admin.assignedTenants.map(at => ({
        tenant_id: at.tenant.tenant_id,
        name: at.tenant.name,
        domain: at.tenant.domain,
        status: at.tenant.status
      }));
    }

    res.json({
      admin: {
        id: admin.admin_id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      tenants
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get admin info' });
  }
});

// ============ ADMIN MANAGEMENT ROUTES (SUPER_ADMIN only) ============

// GET /platform-admin/admins - List all platform admins
router.get('/admins', verifyPlatformAdmin, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const admins = await prisma.platformAdmin.findMany({
      include: {
        assignedTenants: {
          include: { tenant: true }
        },
        creator: {
          select: { admin_id: true, name: true, email: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(admins.map(admin => ({
      id: admin.admin_id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
      createdAt: admin.created_at,
      createdBy: admin.creator ? {
        id: admin.creator.admin_id,
        name: admin.creator.name,
        email: admin.creator.email
      } : null,
      assignedTenants: admin.assignedTenants.map(at => ({
        id: at.tenant.tenant_id,
        name: at.tenant.name,
        domain: at.tenant.domain
      }))
    })));
  } catch (error) {
    console.error('List admins error:', error);
    res.status(500).json({ error: 'Failed to list admins' });
  }
});

// POST /platform-admin/admins - Create new platform admin
router.post('/admins', verifyPlatformAdmin, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role, tenantIds } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (role && !['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingAdmin = await prisma.platformAdmin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.platformAdmin.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
        role: role || 'PLATFORM_ADMIN',
        status: 'active',
        created_by: req.platformAdmin!.adminId
      }
    });

    // Assign tenants if provided
    if (tenantIds && Array.isArray(tenantIds) && tenantIds.length > 0) {
      await prisma.platformAdminTenant.createMany({
        data: tenantIds.map((tenantId: string) => ({
          admin_id: admin.admin_id,
          tenant_id: tenantId,
          assigned_by: req.platformAdmin!.adminId
        }))
      });
    }

    const createdAdmin = await prisma.platformAdmin.findUnique({
      where: { admin_id: admin.admin_id },
      include: {
        assignedTenants: {
          include: { tenant: true }
        }
      }
    });

    res.status(201).json({
      id: createdAdmin!.admin_id,
      email: createdAdmin!.email,
      name: createdAdmin!.name,
      role: createdAdmin!.role,
      status: createdAdmin!.status,
      assignedTenants: createdAdmin!.assignedTenants.map(at => ({
        id: at.tenant.tenant_id,
        name: at.tenant.name,
        domain: at.tenant.domain
      }))
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// PATCH /platform-admin/admins/:id - Update platform admin
router.patch('/admins/:id', verifyPlatformAdmin, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, role, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (role && ['SUPER_ADMIN', 'PLATFORM_ADMIN'].includes(role)) updateData.role = role;
    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    const admin = await prisma.platformAdmin.update({
      where: { admin_id: id },
      data: updateData,
      include: {
        assignedTenants: {
          include: { tenant: true }
        }
      }
    });

    res.json({
      id: admin.admin_id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status,
      assignedTenants: admin.assignedTenants.map(at => ({
        id: at.tenant.tenant_id,
        name: at.tenant.name,
        domain: at.tenant.domain
      }))
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// DELETE /platform-admin/admins/:id - Delete platform admin
router.delete('/admins/:id', verifyPlatformAdmin, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.platformAdmin!.adminId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.platformAdmin.delete({
      where: { admin_id: id }
    });

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// ============ TENANT ASSIGNMENT ROUTES ============

// POST /platform-admin/admins/:id/tenants - Assign tenants to admin
router.post('/admins/:id/tenants', verifyPlatformAdmin, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantIds } = req.body;

    if (!tenantIds || !Array.isArray(tenantIds)) {
      return res.status(400).json({ error: 'tenantIds array required' });
    }

    // Remove existing assignments
    await prisma.platformAdminTenant.deleteMany({
      where: { admin_id: id }
    });

    // Create new assignments
    if (tenantIds.length > 0) {
      await prisma.platformAdminTenant.createMany({
        data: tenantIds.map((tenantId: string) => ({
          admin_id: id,
          tenant_id: tenantId,
          assigned_by: req.platformAdmin!.adminId
        }))
      });
    }

    const admin = await prisma.platformAdmin.findUnique({
      where: { admin_id: id },
      include: {
        assignedTenants: {
          include: { tenant: true }
        }
      }
    });

    res.json({
      id: admin!.admin_id,
      assignedTenants: admin!.assignedTenants.map(at => ({
        id: at.tenant.tenant_id,
        name: at.tenant.name,
        domain: at.tenant.domain
      }))
    });
  } catch (error) {
    console.error('Assign tenants error:', error);
    res.status(500).json({ error: 'Failed to assign tenants' });
  }
});

// ============ TENANT MANAGEMENT ROUTES ============

// GET /platform-admin/tenants - List tenants (filtered by access)
router.get('/tenants', verifyPlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let tenants;

    if (req.platformAdmin!.role === 'SUPER_ADMIN') {
      tenants = await prisma.tenant.findMany({
        include: {
          features: {
            include: { feature: true }
          },
          _count: {
            select: { users: true, orders: true, menus: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
    } else {
      const adminWithTenants = await prisma.platformAdmin.findUnique({
        where: { admin_id: req.platformAdmin!.adminId },
        include: {
          assignedTenants: {
            include: {
              tenant: {
                include: {
                  features: {
                    include: { feature: true }
                  },
                  _count: {
                    select: { users: true, orders: true, menus: true }
                  }
                }
              }
            }
          }
        }
      });
      tenants = adminWithTenants?.assignedTenants.map(at => at.tenant) || [];
    }

    // Get admin counts for each tenant (platform admins + restaurant owners/staff)
    const tenantsWithStats = await Promise.all(tenants.map(async (tenant) => {
      // Count platform admins assigned to this restaurant
      const platformAdminCount = await prisma.platformAdminTenant.count({
        where: { tenant_id: tenant.tenant_id }
      });
      
      // Count restaurant users with admin roles (OWNER, STAFF)
      const restaurantAdminCount = await prisma.user.count({
        where: {
          tenant_id: tenant.tenant_id,
          roles: {
            some: {
              role: {
                name: { in: ['OWNER', 'STAFF'] }
              }
            }
          }
        }
      });
      
      return {
        id: tenant.tenant_id,
        name: tenant.name,
        domain: tenant.domain,
        status: tenant.status,
        currencyCode: tenant.currency_code,
        createdAt: tenant.created_at,
        features: tenant.features.map(tf => ({
          key: tf.feature.feature_key,
          enabled: tf.is_enabled,
          description: tf.feature.description
        })),
        stats: {
          admins: platformAdminCount + restaurantAdminCount, // Total admins
          orders: tenant._count.orders,
          menus: tenant._count.menus
        }
      };
    }));

    res.json(tenantsWithStats);
  } catch (error) {
    console.error('List tenants error:', error);
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

// POST /platform-admin/tenants - Create new tenant (SUPER_ADMIN only)
router.post('/tenants', verifyPlatformAdmin, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, domain, currencyCode, ownerEmail, ownerPassword, assignToAdminId } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ error: 'Name and domain are required' });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        domain,
        status: 'active',
        currency_code: currencyCode || 'USD'
      }
    });

    // Enable default features
    const features = await prisma.feature.findMany();
    if (features.length > 0) {
      await prisma.tenantFeature.createMany({
        data: features.map(f => ({
          tenant_id: tenant.tenant_id,
          feature_id: f.feature_id,
          is_enabled: f.default_enabled
        }))
      });
    }

    // Create default owner user if email provided
    let ownerUser = null;
    const defaultEmail = ownerEmail || `owner@${domain}`;
    const defaultPassword = ownerPassword || 'owner123';
    
    // Get or create OWNER role
    let ownerRole = await prisma.role.findFirst({
      where: { tenant_id: tenant.tenant_id, name: 'OWNER' }
    });
    
    if (!ownerRole) {
      ownerRole = await prisma.role.create({
        data: {
          tenant_id: tenant.tenant_id,
          name: 'OWNER',
          description: 'Restaurant Owner'
        }
      });
    }

    // Create owner user
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    ownerUser = await prisma.user.create({
      data: {
        tenant_id: tenant.tenant_id,
        email: defaultEmail,
        password_hash: passwordHash,
        status: 'active'
      }
    });

    // Assign owner role to user
    await prisma.userRole.create({
      data: {
        user_id: ownerUser.user_id,
        role_id: ownerRole.role_id,
        tenant_id: tenant.tenant_id
      }
    });

    // Assign the restaurant to a platform admin if specified
    const creatingAdmin = (req as AuthenticatedRequest).platformAdmin;
    if (assignToAdminId) {
      await prisma.platformAdminTenant.create({
        data: {
          admin_id: assignToAdminId,
          tenant_id: tenant.tenant_id,
          assigned_by: creatingAdmin!.adminId
        }
      });
    }

    res.status(201).json({
      id: tenant.tenant_id,
      name: tenant.name,
      domain: tenant.domain,
      status: tenant.status,
      currencyCode: tenant.currency_code,
      owner: {
        email: defaultEmail,
        password: defaultPassword // Only returned on creation
      }
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// PATCH /platform-admin/tenants/:id - Update tenant
router.patch('/tenants/:id', verifyPlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, status, currencyCode } = req.body;

    // Check access
    if (req.platformAdmin!.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.platformAdminTenant.findUnique({
        where: {
          admin_id_tenant_id: {
            admin_id: req.platformAdmin!.adminId,
            tenant_id: id
          }
        }
      });
      if (!hasAccess) {
        return res.status(403).json({ error: 'No access to this tenant' });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (currencyCode) updateData.currency_code = currencyCode;

    const tenant = await prisma.tenant.update({
      where: { tenant_id: id },
      data: updateData
    });

    res.json({
      id: tenant.tenant_id,
      name: tenant.name,
      domain: tenant.domain,
      status: tenant.status,
      currencyCode: tenant.currency_code
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// PATCH /platform-admin/tenants/:id/features - Update tenant features
router.patch('/tenants/:id/features', verifyPlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { features } = req.body; // { featureKey: boolean }

    // Check access
    if (req.platformAdmin!.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.platformAdminTenant.findUnique({
        where: {
          admin_id_tenant_id: {
            admin_id: req.platformAdmin!.adminId,
            tenant_id: id
          }
        }
      });
      if (!hasAccess) {
        return res.status(403).json({ error: 'No access to this tenant' });
      }
    }

    // Update each feature
    for (const [featureKey, enabled] of Object.entries(features)) {
      const feature = await prisma.feature.findUnique({
        where: { feature_key: featureKey }
      });

      if (feature) {
        await prisma.tenantFeature.upsert({
          where: {
            tenant_id_feature_id: {
              tenant_id: id,
              feature_id: feature.feature_id
            }
          },
          update: { is_enabled: enabled as boolean },
          create: {
            tenant_id: id,
            feature_id: feature.feature_id,
            is_enabled: enabled as boolean
          }
        });
      }
    }

    const tenant = await prisma.tenant.findUnique({
      where: { tenant_id: id },
      include: {
        features: {
          include: { feature: true }
        }
      }
    });

    res.json({
      id: tenant!.tenant_id,
      features: tenant!.features.map(tf => ({
        key: tf.feature.feature_key,
        enabled: tf.is_enabled,
        description: tf.feature.description
      }))
    });
  } catch (error) {
    console.error('Update features error:', error);
    res.status(500).json({ error: 'Failed to update features' });
  }
});

// GET /platform-admin/tenants/:id/users - Get users for a tenant
router.get('/tenants/:id/users', verifyPlatformAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check access
    if (req.platformAdmin!.role !== 'SUPER_ADMIN') {
      const hasAccess = await prisma.platformAdminTenant.findUnique({
        where: {
          admin_id_tenant_id: {
            admin_id: req.platformAdmin!.adminId,
            tenant_id: id
          }
        }
      });
      if (!hasAccess) {
        return res.status(403).json({ error: 'No access to this tenant' });
      }
    }

    // Get platform admins assigned to this tenant
    const platformAdminAssignments = await prisma.platformAdminTenant.findMany({
      where: { tenant_id: id },
      include: {
        admin: true
      },
      orderBy: { assigned_at: 'desc' }
    });

    const platformAdmins = platformAdminAssignments.map(a => ({
      id: a.admin.admin_id,
      email: a.admin.email,
      name: a.admin.name,
      type: 'platform_admin' as const,
      role: a.admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Platform Admin',
      status: a.admin.status,
      createdAt: a.assigned_at.toISOString()
    }));

    // Get restaurant users with admin roles (OWNER, STAFF)
    const restaurantAdmins = await prisma.user.findMany({
      where: {
        tenant_id: id,
        roles: {
          some: {
            role: {
              name: { in: ['OWNER', 'STAFF'] }
            }
          }
        }
      },
      include: {
        roles: {
          include: { role: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const restaurantAdminsList = restaurantAdmins.map(u => ({
      id: u.user_id,
      email: u.email,
      name: u.email.split('@')[0], // Use email prefix as name if no name field
      type: 'restaurant_admin' as const,
      role: u.roles.map(r => r.role.name).join(', '),
      status: u.status,
      createdAt: u.created_at.toISOString()
    }));

    // Combine both lists
    res.json([...platformAdmins, ...restaurantAdminsList]);
  } catch (error: any) {
    console.error('Get tenant admins error:', error);
    res.status(500).json({ error: 'Failed to get tenant admins', details: error.message });
  }
});

// DELETE /platform-admin/tenants/:id - Delete tenant and all data (SUPER_ADMIN only)
router.delete('/tenants/:id', verifyPlatformAdmin, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { tenant_id: id }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Delete all related data in order (respecting foreign key constraints)
    // 1. Delete cart items
    await prisma.cartItem.deleteMany({
      where: { cart: { tenant_id: id } }
    });

    // 2. Delete carts
    await prisma.cart.deleteMany({
      where: { tenant_id: id }
    });

    // 3. Delete order items
    await prisma.orderItem.deleteMany({
      where: { order: { tenant_id: id } }
    });

    // 4. Delete orders
    await prisma.order.deleteMany({
      where: { tenant_id: id }
    });

    // 5. Delete menu items
    await prisma.menuItem.deleteMany({
      where: { category: { menu: { tenant_id: id } } }
    });

    // 6. Delete menu categories
    await prisma.menuCategory.deleteMany({
      where: { menu: { tenant_id: id } }
    });

    // 7. Delete menus
    await prisma.menu.deleteMany({
      where: { tenant_id: id }
    });

    // 8. Delete user roles
    await prisma.userRole.deleteMany({
      where: { tenant_id: id }
    });

    // 9. Delete roles
    await prisma.role.deleteMany({
      where: { tenant_id: id }
    });

    // 10. Delete refresh tokens for users
    await prisma.refreshToken.deleteMany({
      where: { user: { tenant_id: id } }
    });

    // 11. Delete users
    await prisma.user.deleteMany({
      where: { tenant_id: id }
    });

    // 12. Delete tenant features
    await prisma.tenantFeature.deleteMany({
      where: { tenant_id: id }
    });

    // 13. Delete tenant settings
    await prisma.tenantSetting.deleteMany({
      where: { tenant_id: id }
    });

    // 14. Delete platform admin tenant assignments
    await prisma.platformAdminTenant.deleteMany({
      where: { tenant_id: id }
    });

    // 15. Finally delete the tenant
    await prisma.tenant.delete({
      where: { tenant_id: id }
    });

    res.json({ message: 'Tenant deleted successfully', id });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

export default router;
