import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Permissions (tenant scope)
  const permissions = [
    'menu.read','menu.write',
    'offer.read','offer.write',
    'order.read','order.write','order.status.update',
    'payment.create','payment.refund',
    'delivery.task.assign','delivery.task.update',
    'settings.read','settings.write',
    'media.upload','media.link',
    'analytics.read'
  ];
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p },
      update: {},
      create: { name: p, scope: 'tenant', description: '' }
    });
  }

  // 2. Features
  const features = [
    { feature_key: 'PAYMENT', default_enabled: true, description: 'Enable payments' },
    { feature_key: 'DELIVERY_TRACKING', default_enabled: true, description: 'Enable delivery tasks/events' },
    { feature_key: 'WEB_CLIENT', default_enabled: true, description: 'Enable web ordering client' },
    { feature_key: 'ANALYTICS', default_enabled: true, description: 'Enable analytics dashboards' },
    { feature_key: 'INVOICING', default_enabled: true, description: 'Enable invoices' }
  ];
  for (const f of features) {
    await prisma.feature.upsert({
      where: { feature_key: f.feature_key },
      update: {},
      create: f
    });
  }

  // 3. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'example-restaurant.com' },
    update: { status: 'active' },
    create: {
      name: 'Example Restaurant',
      domain: 'example-restaurant.com',
      status: 'active',
      currency_code: 'USD'
    }
  });

  // 4. Roles
  const roleDefs = [
    { name: 'OWNER', description: 'Full access' },
    { name: 'STAFF', description: 'Manage catalog and orders' },
    { name: 'DELIVERY_AGENT', description: 'Handle deliveries' },
    { name: 'CUSTOMER', description: 'Place orders' }
  ];
  const rolesMap: Record<string,string> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { tenant_id_name: { tenant_id: tenant.tenant_id, name: r.name } },
      update: {},
      create: { tenant_id: tenant.tenant_id, name: r.name, description: r.description }
    });
    rolesMap[r.name] = role.role_id;
  }

  // 5. Assign permissions to OWNER (all) and STAFF (subset)
  const allPerms = await prisma.permission.findMany();
  const ownerPermIds = allPerms.map(p => p.permission_id);
  const staffPermKeys = [
    'menu.read','menu.write',
    'offer.read','offer.write',
    'order.read','order.write','order.status.update',
    'media.upload','media.link'
  ];
  const staffPermIds = allPerms.filter(p => staffPermKeys.includes(p.name)).map(p => p.permission_id);

  for (const pid of ownerPermIds) {
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: rolesMap.OWNER, permission_id: pid } },
      update: {},
      create: { role_id: rolesMap.OWNER, permission_id: pid, tenant_id: tenant.tenant_id }
    });
  }
  for (const pid of staffPermIds) {
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: rolesMap.STAFF, permission_id: pid } },
      update: {},
      create: { role_id: rolesMap.STAFF, permission_id: pid, tenant_id: tenant.tenant_id }
    });
  }

  // 6. Tenant features (default from Feature)
  const featureRows = await prisma.feature.findMany();
  for (const fr of featureRows) {
    await prisma.tenantFeature.upsert({
      where: { tenant_id_feature_id: { tenant_id: tenant.tenant_id, feature_id: fr.feature_id } },
      update: { is_enabled: fr.default_enabled },
      create: {
        tenant_id: tenant.tenant_id,
        feature_id: fr.feature_id,
        is_enabled: fr.default_enabled
      }
    });
  }

  // 7. Owner user
  const ownerPass = await bcrypt.hash('OwnerPass123!', 10);
  const ownerUser = await prisma.user.upsert({
    where: { tenant_id_email: { tenant_id: tenant.tenant_id, email: 'owner@example.com' } },
    update: {},
    create: {
      tenant_id: tenant.tenant_id,
      email: 'owner@example.com',
      password_hash: ownerPass,
      status: 'active'
    }
  });
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: ownerUser.user_id, role_id: rolesMap.OWNER } },
    update: {},
    create: { user_id: ownerUser.user_id, role_id: rolesMap.OWNER, tenant_id: tenant.tenant_id }
  });

  // 8. Sample menu, category, item
  const menu = await prisma.menu.upsert({
    where: { tenant_id_name: { tenant_id: tenant.tenant_id, name: 'Main Menu' } },
    update: {},
    create: { tenant_id: tenant.tenant_id, name: 'Main Menu', description: 'Primary menu', is_active: true }
  });
  const category = await prisma.menuCategory.upsert({
    where: { menu_id_name_tenant_id: { menu_id: menu.menu_id, name: 'Burgers', tenant_id: tenant.tenant_id } },
    update: {},
    create: { tenant_id: tenant.tenant_id, menu_id: menu.menu_id, name: 'Burgers', order_index: 1 }
  });
  await prisma.menuItem.upsert({
    where: { category_id_name_tenant_id: { category_id: category.category_id, name: 'Classic Burger', tenant_id: tenant.tenant_id } },
    update: {},
    create: {
      tenant_id: tenant.tenant_id,
      category_id: category.category_id,
      name: 'Classic Burger',
      description: 'Beef patty, lettuce, tomato',
      price: 9.99,
      is_available: true
    }
  });

  console.log('Seed complete. Tenant ID:', tenant.tenant_id);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());