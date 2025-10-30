import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  const token = header.slice('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET || '';
    const payload = jwt.verify(token, secret) as { id: string };
    req.user = { id: payload.id };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
