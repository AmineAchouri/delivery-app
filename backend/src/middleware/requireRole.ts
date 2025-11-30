import { Request, Response, NextFunction } from 'express';

// Roles that have admin privileges
const ADMIN_ROLES = ['admin', 'OWNER', 'STAFF', 'SUPER_ADMIN', 'PLATFORM_ADMIN'];

export function requireRole(role: 'admin') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(403).json({ message: 'Forbidden' });
    
    // Check if user has any admin role
    const userRoles = user.roles || [user.role];
    const hasAdminRole = userRoles.some((r: string) => ADMIN_ROLES.includes(r));
    
    if (!hasAdminRole) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}