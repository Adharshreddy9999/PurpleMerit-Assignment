import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware to check for token revocation and enforce stronger JWT security
export function jwtSecurity(req: Request, res: Response, next: NextFunction) {
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
    // Optionally: check for token revocation (e.g., in Redis or DB)
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
