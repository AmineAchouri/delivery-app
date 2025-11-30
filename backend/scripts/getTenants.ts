import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:');
  tenants.forEach(t => {
    console.log(`  ID: ${t.tenant_id}`);
    console.log(`  Name: ${t.name}`);
    console.log(`  Domain: ${t.domain}`);
    console.log('---');
  });

  const users = await prisma.user.findMany({
    include: { tenant: true }
  });
  console.log('\nUsers:');
  users.forEach(u => {
    console.log(`  Email: ${u.email}`);
    console.log(`  Tenant: ${u.tenant.name} (${u.tenant_id})`);
    console.log('---');
  });
}

main().finally(() => prisma.$disconnect());
