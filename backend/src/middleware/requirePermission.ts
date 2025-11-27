import { Request, Response, NextFunction } from 'express';

export function requirePermission(key: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user?.perms || !user.perms.includes(key)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}