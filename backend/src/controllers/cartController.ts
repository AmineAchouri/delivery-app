import { Request, Response } from 'express';
import { PrismaClient, CartItem as CartItemModel, MenuItem as MenuItemModel } from '@prisma/client';

const prisma = new PrismaClient();

async function getOrCreateCart(tenantId: string, userId: string) {
  const existing = await prisma.cart.findFirst({ where: { tenant_id: tenantId, user_id: userId } });
  return existing ?? prisma.cart.create({ data: { tenant_id: tenantId, user_id: userId } });
}

export async function getCart(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.sub;
  const cart = await getOrCreateCart(tenantId, userId);
  const items = await prisma.cartItem.findMany({
    where: { tenant_id: tenantId, cart_id: cart.cart_id },
    include: { item: true }
  });
  res.json({
    cart_id: cart.cart_id,
    items: items.map((ci: (CartItemModel & { item: MenuItemModel })) => ({
      cart_item_id: ci.cart_item_id,
      item_id: ci.item_id,
      name: ci.item.name,
      qty: ci.qty,
      price: ci.price
    }))
  });
}

export async function addItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.sub;
  let { item_id, qty } = req.body;

  if (Array.isArray(item_id)) item_id = item_id[0];
  const cart = await getOrCreateCart(tenantId, userId);
  const item = await prisma.menuItem.findFirst({ where: { item_id, tenant_id: tenantId, is_available: true } });
  if (!item) return res.status(404).json({ message: 'Item not found' });

  const existing = await prisma.cartItem.findFirst({ where: { cart_id: cart.cart_id, item_id } });
  const price = item.price;
  const result = existing
    ? await prisma.cartItem.update({ where: { cart_item_id: existing.cart_item_id }, data: { qty: existing.qty + qty, price } })
    : await prisma.cartItem.create({ data: { cart_id: cart.cart_id, tenant_id: tenantId, item_id, qty, price } });

  res.status(201).json({ cart_item_id: result.cart_item_id, qty: result.qty });
}

export async function updateItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { qty } = req.body;
  const item = await prisma.cartItem.findFirst({ where: { cart_item_id: id, tenant_id: tenantId } });
  if (!item) return res.status(404).json({ message: 'Cart item not found' });
  const updated = await prisma.cartItem.update({ where: { cart_item_id: id }, data: { qty } });
  res.json({ cart_item_id: updated.cart_item_id, qty: updated.qty });
}

export async function deleteItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const item = await prisma.cartItem.findFirst({ where: { cart_item_id: id, tenant_id: tenantId } });
  if (!item) return res.status(404).json({ message: 'Cart item not found' });
  await prisma.cartItem.delete({ where: { cart_item_id: id } });
  res.status(204).end();
}

export async function checkout(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const userId = (req as any).user?.sub;
  const cart = await prisma.cart.findFirst({ where: { tenant_id: tenantId, user_id: userId } });
  if (!cart) return res.status(400).json({ message: 'Cart is empty' });
  const items = await prisma.cartItem.findMany({ where: { tenant_id: tenantId, cart_id: cart.cart_id } });
  if (!items.length) return res.status(400).json({ message: 'Cart is empty' });

  const subtotal = items.reduce((sum: number, ci: CartItemModel) => sum + Number(ci.price) * ci.qty, 0);
  const taxRate = 0.0;
  const tax = +(subtotal * taxRate).toFixed(2);
  const discount = 0.0;
  const total = +(subtotal + tax - discount).toFixed(2);

  const tenant = await prisma.tenant.findUnique({ where: { tenant_id: tenantId } });
  const currency = tenant?.currency_code || 'USD';

  const order = await prisma.order.create({
    data: {
      tenant_id: tenantId,
      user_id: userId,
      order_status: 'created',
      payment_status: 'pending',
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2),
      currency_code: currency
    }
  });

  const cartItems = await prisma.cartItem.findMany({
    where: { tenant_id: tenantId, cart_id: cart.cart_id },
    include: { item: true }
  });

  if (cartItems.length) {
    await prisma.orderItem.createMany({
      data: cartItems.map((ci: (CartItemModel & { item: MenuItemModel })) => ({
        order_id: order.order_id,
        tenant_id: tenantId,
        item_id: ci.item_id,
        name: ci.item.name,
        qty: ci.qty,
        unit_price: ci.price.toString(),
        line_total: (Number(ci.price) * ci.qty).toFixed(2)
      }))
    });
  }

  await prisma.cartItem.deleteMany({ where: { cart_id: cart.cart_id } });
  res.status(201).json({ order_id: order.order_id, total: order.total, currency_code: order.currency_code });
}