import { Request, Response, NextFunction } from 'express';

// Sanitizes objects to prevent leaking PII, passwords, private keys, or tokens in logs
export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeLogData);

  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'secretKey',
    'privateKey',
    'privateKeyJwk',
    'jwtVc',
    'birthDate',
    'nationalIdLast4',
    'annualIncome',
    'ssn',
    'authorization',
  ];

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  (req as any).requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      userAgent: req.headers['user-agent']?.slice(0, 80),
      ip: req.ip || req.socket.remoteAddress,
      query: sanitizeLogData(req.query),
    };

    if (res.statusCode >= 400) {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}
