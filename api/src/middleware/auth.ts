import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    // Enforce strong algorithms and expiration
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret', {
      algorithms: ['HS256'],
      maxAge: '1h',
    });
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
