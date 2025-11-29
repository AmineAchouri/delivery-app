import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  const type = status >= 500 ? 'about:blank' : 'https://httpstatuses.com/' + status;
  const title = err.title ?? (status >= 500 ? 'Internal Server Error' : 'Bad Request');
  const detail = err.message ?? 'An error occurred';
  res.status(status).json({ type, title, status, detail });
}