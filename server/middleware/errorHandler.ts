import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  type: string;
  details?: any;

  constructor(message: string, statusCode: number = 400, type: string = 'bad-request', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.type = `https://zeropass.network/errors/${type}`;
    this.details = details;
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || `req_${Date.now()}`;

  // Handle Zod validation errors
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const issues = (err as any).issues || (err as any).errors || [];
    return res.status(400).json({
      type: 'https://zeropass.network/errors/validation-error',
      title: 'Validation Failed',
      status: 400,
      detail: 'The submitted request payload failed schema validation.',
      errors: issues.map((e: any) => ({
        path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
        message: e.message,
      })),
      requestId,
    });
  }

  // Handle known AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      type: err.type,
      title: err.name,
      status: err.statusCode,
      detail: err.message,
      details: err.details,
      requestId,
    });
  }

  // Unhandled server errors (Never leak raw stack traces to client)
  console.error(`[ERROR ${requestId}]`, err);
  return res.status(500).json({
    type: 'https://zeropass.network/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected internal error occurred. Please reference the request ID for diagnostics.',
    requestId,
  });
}
