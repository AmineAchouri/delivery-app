import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create the initial Super Admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  
  const superAdmin = await prisma.platformAdmin.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {},
    create: {
      email: 'superadmin@platform.com',
      password_hash: superAdminPassword,
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      status: 'active',
      created_by: null, // No creator for initial super admin
    }
  });

  console.log('Super Admin created:');
  console.log('  Email: superadmin@platform.com');
  console.log('  Password: SuperAdmin123!');
  console.log('  Role: SUPER_ADMIN');
  console.log('  ID:', superAdmin.admin_id);

  // Create a sample Platform Admin (with limited access)
  const platformAdminPassword = await bcrypt.hash('PlatformAdmin123!', 10);
  
  const platformAdmin = await prisma.platformAdmin.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      password_hash: platformAdminPassword,
      name: 'Platform Admin',
      role: 'PLATFORM_ADMIN',
      status: 'active',
      created_by: superAdmin.admin_id,
    }
  });

  console.log('\nPlatform Admin created:');
  console.log('  Email: admin@platform.com');
  console.log('  Password: PlatformAdmin123!');
  console.log('  Role: PLATFORM_ADMIN');
  console.log('  ID:', platformAdmin.admin_id);

  // Assign the Example Restaurant tenant to the Platform Admin
  const tenant = await prisma.tenant.findFirst({
    where: { domain: 'example-restaurant.com' }
  });

  if (tenant) {
    await prisma.platformAdminTenant.upsert({
      where: {
        admin_id_tenant_id: {
          admin_id: platformAdmin.admin_id,
          tenant_id: tenant.tenant_id
        }
      },
      update: {},
      create: {
        admin_id: platformAdmin.admin_id,
        tenant_id: tenant.tenant_id,
        assigned_by: superAdmin.admin_id
      }
    });

    console.log('\nAssigned tenant to Platform Admin:');
    console.log('  Tenant:', tenant.name);
    console.log('  Domain:', tenant.domain);
  }

  console.log('\n✅ Platform admin seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding platform admins:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
