import { Request, Response, NextFunction } from 'express';

const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequests = 30;
const ipRequestCounts: Record<string, { count: number; timestamp: number }> = {};

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  // Use req.ip, fallback to x-forwarded-for, or 'unknown' if not available
  const ip = req.ip || (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || 'unknown';
  const now = Date.now();
  if (!ipRequestCounts[ip] || now - ipRequestCounts[ip].timestamp > rateLimitWindowMs) {
    ipRequestCounts[ip] = { count: 1, timestamp: now };
    return next();
  }
  ipRequestCounts[ip].count++;
  if (ipRequestCounts[ip].count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
}
