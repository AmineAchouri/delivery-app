import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { JwtClaims } from '../types/jwt';

// Read public key from env or file (same logic as services/auth.ts)
function readKeyFromEnvOrFile(envVarContent: string, envVarPath: string, defaultFileName: string) {
  const content = (process.env[envVarContent] || '').replace(/\\n/g, '\n').trim();
  if (content) return content;
  const relPath = (process.env[envVarPath] || '').trim();
  const filePath = relPath
    ? path.resolve(process.cwd(), relPath)
    : path.resolve(__dirname, '..', 'keys', defaultFileName);
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8').trim();
  return '';
}

const PUBLIC_KEY = readKeyFromEnvOrFile('JWT_PUBLIC_KEY', 'JWT_PUBLIC_KEY_FILE', 'jwt_public.pem');
const TOKEN_ISS = process.env.TOKEN_ISS || 'delivery-app';
const TOKEN_AUD_TENANT = process.env.TOKEN_AUD_TENANT || 'tenant-api';

export function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing bearer token' });
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: TOKEN_ISS,
      audience: TOKEN_AUD_TENANT
    }) as JwtClaims;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}