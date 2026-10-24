import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { env } from '../config/env';
import { db } from '../db/repository';
import { DbUser, UserRole } from '../db/types';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
}

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export async function createAuthToken(user: DbUser): Promise<string> {
  return await new jose.SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    did: user.did,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware: Enforces that the request has a valid Bearer JWT token
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing Bearer token.', 401, 'unauthorized'));
  }

  const token = authHeader.split(' ')[1];
  const payload = await verifyAuthToken(token);
  if (!payload || !payload.id) {
    return next(new AppError('Invalid or expired authentication token.', 401, 'invalid-token'));
  }

  const user = await db.findUserById(payload.id as string);
  if (!user) {
    return next(new AppError('User belonging to this token no longer exists.', 401, 'user-not-found'));
  }

  req.user = user;
  next();
}

/**
 * Middleware: Enforces that the authenticated user possesses one of the allowed roles.
 * Never relies on client-side role assertions!
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'unauthorized'));
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return next(
        new AppError(
          `Forbidden. Role '${req.user.role}' is not authorized for this resource. Required roles: ${allowedRoles.join(', ')}`,
          403,
          'forbidden'
        )
      );
    }

    next();
  };
}

/**
 * Optional authentication: loads user if valid token exists, but doesn't block if missing
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = await verifyAuthToken(token);
    if (payload && payload.id) {
      const user = await db.findUserById(payload.id as string);
      if (user) req.user = user;
    }
  }
  next();
}
