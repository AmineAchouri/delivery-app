import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'TENANT_DEV_1';
  const email = 'admin@example.com';
  const password = 'secret';
  const password_hash = await bcrypt.hash(password, 10);

  const tenant = await prisma.tenant.findFirst({ where: { tenant_id: tenantId } });
  if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

  const user = await prisma.user.upsert({
    where: { tenant_id_email: { tenant_id: tenantId, email } },
    update: { password_hash, status: 'active' },
    create: { tenant_id: tenantId, email, password_hash, status: 'active' }
  });

  // Ensure OWNER role exists
  const ownerRole = await prisma.role.upsert({
    where: { tenant_id_name: { tenant_id: tenantId, name: 'OWNER' } },
    update: {},
    create: { tenant_id: tenantId, name: 'OWNER', description: 'Tenant owner/admin' }
  });

  // Attach OWNER role to user
  await prisma.userRole.upsert({
    where: { user_id_role_id: { user_id: user.user_id, role_id: ownerRole.role_id } },
    update: {},
    create: { user_id: user.user_id, role_id: ownerRole.role_id, tenant_id: tenantId }
  });

  console.log(`Admin seeded: ${email} (OWNER role)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());