
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

export function validateBody(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = result.error as ZodError<any>;
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues.map((e: ZodIssue) => ({ path: e.path, message: e.message }))
      });
    }
    req.body = result.data;
    next();
  };
}
