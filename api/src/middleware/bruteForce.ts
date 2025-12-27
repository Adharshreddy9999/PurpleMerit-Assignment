import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Brute-force protection for sensitive endpoints (e.g., login, register)
export const bruteForceProtection = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
