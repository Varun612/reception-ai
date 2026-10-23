import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Prisma Unique Constraint Violations
  if (err.code === 'P2002') {
    const fields = (err.meta?.target as string[]) || [];
    return res.status(409).json({
      error: `Conflict: A record with that ${fields.join(', ') || 'field'} already exists.`,
    });
  }

  // Handle Prisma Record Not Found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'The requested resource was not found.',
    });
  }

  // General Logging (redacting sensitive fields)
  console.error('[SERVER ERROR]', {
    method: req.method,
    url: req.originalUrl,
    error: err.message || err,
  });

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
};
