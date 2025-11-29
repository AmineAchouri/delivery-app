import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const tenantId = 'TENANT_DEV_1';

async function main() {
  // Ensure tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { tenant_id: tenantId } });
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found. Run seed-dev-user first or create tenant.`);
  }

  // Upsert a menu
  const menu = await prisma.menu.upsert({
    where: { tenant_id_name: { tenant_id: tenantId, name: 'Main Menu' } },
    update: {},
    create: {
      tenant_id: tenantId,
      name: 'Main Menu',
      description: 'Default menu',
      is_active: true
    }
  });

  // Upsert categories
  const cats = await Promise.all([
    prisma.menuCategory.upsert({
      where: { menu_id_name_tenant_id: { menu_id: menu.menu_id, name: 'Burgers', tenant_id: tenantId } },
      update: {},
      create: { tenant_id: tenantId, menu_id: menu.menu_id, name: 'Burgers', order_index: 1 }
    }),
    prisma.menuCategory.upsert({
      where: { menu_id_name_tenant_id: { menu_id: menu.menu_id, name: 'Drinks', tenant_id: tenantId } },
      update: {},
      create: { tenant_id: tenantId, menu_id: menu.menu_id, name: 'Drinks', order_index: 2 }
    }),
    prisma.menuCategory.upsert({
      where: { menu_id_name_tenant_id: { menu_id: menu.menu_id, name: 'Desserts', tenant_id: tenantId } },
      update: {},
      create: { tenant_id: tenantId, menu_id: menu.menu_id, name: 'Desserts', order_index: 3 }
    })
  ]);

  // Upsert items
  const [burgers, drinks, desserts] = cats;
  await Promise.all([
    prisma.menuItem.upsert({
      where: { category_id_name_tenant_id: { category_id: burgers.category_id, name: 'Classic Burger', tenant_id: tenantId } },
      update: { is_available: true },
      create: {
        tenant_id: tenantId,
        category_id: burgers.category_id,
        name: 'Classic Burger',
        description: 'Beef patty, lettuce, tomato',
        price: '8.99',
        is_available: true
      }
    }),
    prisma.menuItem.upsert({
      where: { category_id_name_tenant_id: { category_id: burgers.category_id, name: 'Cheese Burger', tenant_id: tenantId } },
      update: { is_available: true },
      create: {
        tenant_id: tenantId,
        category_id: burgers.category_id,
        name: 'Cheese Burger',
        description: 'Beef patty with cheese',
        price: '9.99',
        is_available: true
      }
    }),
    prisma.menuItem.upsert({
      where: { category_id_name_tenant_id: { category_id: drinks.category_id, name: 'Cola', tenant_id: tenantId } },
      update: { is_available: true },
      create: {
        tenant_id: tenantId,
        category_id: drinks.category_id,
        name: 'Cola',
        description: 'Cold soft drink',
        price: '2.50',
        is_available: true
      }
    }),
    prisma.menuItem.upsert({
      where: { category_id_name_tenant_id: { category_id: desserts.category_id, name: 'Brownie', tenant_id: tenantId } },
      update: { is_available: true },
      create: {
        tenant_id: tenantId,
        category_id: desserts.category_id,
        name: 'Brownie',
        description: 'Chocolate dessert',
        price: '3.75',
        is_available: true
      }
    })
  ]);

  console.log('Seeded catalog for tenant:', tenantId, 'menu:', menu.name);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });