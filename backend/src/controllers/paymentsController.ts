import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { auditLog } from '../utils/audit';
const prisma = new PrismaClient();

const CreateIntentSchema = z.object({ order_id: z.string().uuid() });

export async function createPaymentIntent(req: Request, res: Response, next: Function) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user?.sub ?? null;
    const { order_id } = req.body ?? {};
    if (typeof order_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(order_id)) {
      return res.status(400).json({ message: 'order_id must be a UUID string' });
    }

    const order = await prisma.order.findFirst({ where: { order_id, tenant_id: tenantId, user_id: (req as any).user?.sub } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.payment_status === 'paid') return res.status(400).json({ message: 'Already paid' });

    const clientSecret = `stub_${order.order_id}`;
    await prisma.order.update({ where: { order_id }, data: { payment_status: 'pending' } });

    await auditLog(tenantId, userId, 'order', order_id, 'payment_intent_created', { total: order.total, currency: order.currency_code });

    res.status(201).json({ client_secret: clientSecret, amount: order.total, currency: order.currency_code });
  } catch (err) {
    next(err);
  }
}

// event-only webhook handler used by server.ts
export async function paymentWebhook(event: { type: string; data: { order_id: string } }, res: Response) {
  try {
    const orderId = event?.data?.order_id;
    if (!orderId) return res.status(400).json({ message: 'Missing order_id' });

    if (event.type === 'payment.succeeded') {
      const order = await prisma.order.findUnique({ where: { order_id: orderId } });
      if (!order) return res.status(404).json({ message: 'Order not found' });

      await prisma.order.update({
        where: { order_id: orderId },
        data: { payment_status: 'paid', order_status: 'paid' }
      });

      await auditLog(order.tenant_id, order.user_id, 'order', orderId, 'payment_succeeded');
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ message: 'Webhook processing failed' });
  }
}