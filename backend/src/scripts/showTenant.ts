import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const tenants = await p.tenant.findMany();
  console.log(tenants);
  await p.$disconnect();
})();