import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function auditLog(tenant_id: string, user_id: string | null, entity_type: string, entity_id: string, action_type: string, change_summary?: any) {
  try {
    await prisma.auditLog.create({
      data: { tenant_id, user_id, entity_type, entity_id, action_type, change_summary }
    });
  } catch (e) {
    console.error('AuditLog failed:', e);
  }
}