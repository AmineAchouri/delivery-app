import { z } from 'zod';

export const orderIdParams = z.object({
  id: z.string().uuid()
});