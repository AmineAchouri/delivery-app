import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendWithETag } from '../utils/etag';
const prisma = new PrismaClient();

export async function listMenus(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const menus = await prisma.menu.findMany({
    where: { tenant_id: tenantId, is_active: true },
    orderBy: { created_at: 'desc' }
  });
  res.json(menus);
}

export async function listCategories(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { menuId } = req.params;
  const categories = await prisma.menuCategory.findMany({
    where: { tenant_id: tenantId, menu_id: menuId },
    orderBy: { order_index: 'asc' }
  });
  res.json(categories);
}

export async function listItemsByCategory(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { categoryId } = req.params;
  const items = await prisma.menuItem.findMany({
    where: { tenant_id: tenantId, category_id: categoryId, is_available: true },
    orderBy: { created_at: 'desc' }
  });
  res.json(items);
}

export async function getItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { itemId } = req.params;
  const item = await prisma.menuItem.findFirst({
    where: { tenant_id: tenantId, item_id: itemId, is_available: true }
  });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
}

export async function getMenus(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const menus = await prisma.menu.findMany({ where: { tenant_id: tenantId }, orderBy: { created_at: 'desc' } });
  return sendWithETag(req, res, menus, 300);
}