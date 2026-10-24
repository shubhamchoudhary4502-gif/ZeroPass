import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes (unreferenced so process can exit cleanly)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 300000).unref();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // In production or behind proxy, trust X-Forwarded-For or socket IP
    const clientKey = (req.ip || req.socket.remoteAddress || 'unknown') + ':' + (req.baseUrl || req.path);
    const now = Date.now();
    const existing = rateLimitStore.get(clientKey);

    if (!existing || now > existing.resetAt) {
      rateLimitStore.set(clientKey, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    if (existing.count >= max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      return res.status(429).json({
        type: 'https://zeropass.network/errors/rate-limit-exceeded',
        title: 'Too Many Requests',
        status: 429,
        detail: message,
        retryAfterSeconds: retryAfter,
      });
    }

    existing.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - existing.count);
    next();
  };
}
