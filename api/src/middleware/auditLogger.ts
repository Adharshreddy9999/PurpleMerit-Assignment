import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const logFile = path.join(__dirname, '../../logs/audit.log');

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  const { method, originalUrl } = req;
  const user = (req as any).user || {};
  const entry = `${new Date().toISOString()} | ${method} ${originalUrl} | user:${user.id || 'anon'}\n`;
  fs.appendFile(logFile, entry, err => {
    if (err) console.error('Audit log error:', err);
  });
  next();
}
