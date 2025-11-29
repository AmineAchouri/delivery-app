import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createMenu(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { name } = req.body;
  const menu = await prisma.menu.create({ data: { tenant_id: tenantId, name } });
  res.status(201).json(menu);
}

export async function updateMenu(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { id } = req.params;
  const { name } = req.body;
  const menu = await prisma.menu.update({ where: { menu_id: id }, data: { name } });
  if (menu.tenant_id !== tenantId) return res.status(404).json({ message: 'Not found' });
  res.json(menu);
}

export async function deleteMenu(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.menu.delete({ where: { menu_id: id } });
  res.status(204).end();
}

export async function createCategory(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { menu_id, name } = req.body;
  const cat = await prisma.menuCategory.create({ data: { tenant_id: tenantId, menu_id, name } });
  res.status(201).json(cat);
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name } = req.body;
  const cat = await prisma.menuCategory.update({ where: { category_id: id }, data: { name } });
  res.json(cat);
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.menuCategory.delete({ where: { category_id: id } });
  res.status(204).end();
}

export async function createItem(req: Request, res: Response) {
  const tenantId = (req as any).tenantId;
  const { category_id, name, price, is_available = true } = req.body;
  const item = await prisma.menuItem.create({ data: { tenant_id: tenantId, category_id, name, price: price.toString?.() ?? price, is_available } });
  res.status(201).json(item);
}

export async function updateItemAdmin(req: Request, res: Response) {
  const { id } = req.params;
  const { name, price, is_available } = req.body;
  const item = await prisma.menuItem.update({
    where: { item_id: id },
    data: { name, price: price?.toString?.() ?? price, is_available }
  });
  res.json(item);
}

export async function deleteItemAdmin(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.menuItem.delete({ where: { item_id: id } });
  res.status(204).end();
}