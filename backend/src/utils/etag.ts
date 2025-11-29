import { Request, Response } from 'express';
import crypto from 'crypto';

export function sendWithETag(req: Request, res: Response, payload: unknown, maxAgeSeconds = 60) {
  const body = JSON.stringify(payload);
  const etag = crypto.createHash('sha1').update(body).digest('hex');

  // If client sent If-None-Match and matches, return 304
  const inm = req.headers['if-none-match'];
  if (inm && inm === etag) {
    return res.status(304).end();
  }

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}`);
  res.type('application/json').send(body);
}