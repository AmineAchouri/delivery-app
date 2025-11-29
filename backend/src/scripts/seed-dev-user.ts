import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  const tenantId = 'TENANT_DEV_1';
  const email = 'user@example.com';
  const plain = 'secret';
  const hash = await bcrypt.hash(plain, 10);

  // Upsert tenant
  await prisma.tenant.upsert({
    where: { tenant_id: tenantId },
    update: {},
    create: {
      tenant_id: tenantId,
      name: 'Dev Tenant',
      domain: `dev-${Date.now()}.example.com`,
      status: 'active',
      currency_code: 'USD',
    },
  });

  // Upsert user
  await prisma.user.upsert({
    where: { tenant_id_email: { tenant_id: tenantId, email } },
    update: { password_hash: hash, status: 'active' },
    create: {
      tenant_id: tenantId,
      email,
      password_hash: hash,
      status: 'active',
    },
  });

  console.log('Seeded user:', email, 'tenant:', tenantId);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });