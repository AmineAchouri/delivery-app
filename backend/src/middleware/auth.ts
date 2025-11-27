import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtClaims } from '../types/jwt';

const PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n').trim();

export function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing bearer token' });
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtClaims;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}