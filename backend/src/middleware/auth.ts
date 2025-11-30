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

// Platform admin JWT secret (same as in platformAdmin.routes.ts)
const PLATFORM_JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing bearer token' });
  const token = authHeader.substring(7);
  
  // Try tenant token first (RS256)
  try {
    const decoded = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: TOKEN_ISS,
      audience: TOKEN_AUD_TENANT
    }) as JwtClaims;
    (req as any).user = decoded;
    return next();
  } catch {
    // Tenant token failed, try platform admin token (HS256)
  }
  
  // Try platform admin token
  try {
    const decoded = jwt.verify(token, PLATFORM_JWT_SECRET) as any;
    if (decoded.type === 'platform_admin') {
      // Convert platform admin to user format for compatibility
      (req as any).user = {
        sub: decoded.adminId, // Platform admin uses adminId
        typ: 'platform_admin',
        tenant_id: req.header('X-Tenant-Id') || '',
        roles: [decoded.role], // SUPER_ADMIN or PLATFORM_ADMIN
        perms: ['*'], // Platform admins have all permissions
        iat: decoded.iat,
        exp: decoded.exp
      };
      return next();
    }
  } catch (err) {
    // Platform admin token also failed
    console.error('Platform admin token verification failed:', err);
  }
  
  return res.status(401).json({ message: 'Invalid token' });
}