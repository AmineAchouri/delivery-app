import { z } from 'zod';

export const menuIdParams = z.object({ menuId: z.string().uuid() });
export const categoryIdParams = z.object({ categoryId: z.string().uuid() });
export const itemIdParams = z.object({ itemId: z.string().uuid() });