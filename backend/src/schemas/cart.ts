import { z } from 'zod';

export const addItemSchema = z.object({
  item_id: z.string().uuid().or(z.array(z.string().uuid()).nonempty()),
  qty: z.number().int().positive()
});

export const updateItemSchema = z.object({
  qty: z.number().int().positive()
});