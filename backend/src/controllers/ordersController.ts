import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { auditLog } from '../utils/audit';
const prisma = new PrismaClient();

export async function listOrders(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.sub;

  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
  const status = (req.query.status as string | undefined);
  const sort = (req.query.sort as string | undefined) ?? 'created_at:desc';

  const [sortField, sortDir] = sort.split(':');
  const orderBy: any = { [sortField]: (sortDir === 'asc' ? 'asc' : 'desc') };

  const where: any = { tenant_id: tenantId, user_id: userId };
  if (status) where.order_status = status;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    items
  });
}

export async function getOrder(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.sub;
  const { id } = req.params;

  const order = await prisma.order.findFirst({
    where: { order_id: id, tenant_id: tenantId, user_id: userId },
    include: { items: true }
  });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
}

export async function updateOrderStatus(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.sub ?? null;
  const orderId = req.params.id;
  const { status } = req.body ?? {};
  if (!status) return res.status(400).json({ message: 'status is required' });

  const order = await prisma.order.findFirst({ where: { order_id: orderId, tenant_id: tenantId, user_id: (req as any).user?.sub } });
  if (!order) return res.status(404).json({ message: 'Order not found' });

  await prisma.order.update({ where: { order_id: orderId }, data: { order_status: status } });
  await auditLog(tenantId, userId, 'order', orderId, 'order_status_updated', { from: order.order_status, to: status });

  res.json({ ok: true });
}