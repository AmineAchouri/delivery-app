import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = (req as any)[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors.map(e => ({ path: e.path, message: e.message }))
      });
    }
    (req as any)[source] = result.data;
    next();
  };
}