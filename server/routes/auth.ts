import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { db } from '../db/repository';
import { createAuthToken, authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50, message: 'Too many authentication attempts' });

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2),
  role: z.enum(['HOLDER', 'ISSUER', 'VERIFIER', 'ADMIN']).default('HOLDER'),
  organization: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await db.findUserByEmail(data.email);
    if (existing) {
      throw new AppError('Email is already registered.', 409, 'conflict');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const didHash = crypto.createHash('sha256').update(data.email + Date.now()).digest('hex').slice(0, 16);
    const did = `did:zeropass:testnet:${data.role.toLowerCase()}:${didHash}`;

    const user = await db.createUser({
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      did,
      organization: data.organization,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const token = await createAuthToken(user);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        did: user.did,
        organization: user.organization,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await db.findUserByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'invalid-credentials');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Invalid email or password.', 401, 'invalid-credentials');
    }

    const token = await createAuthToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        did: user.did,
        organization: user.organization,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      did: user.did,
      organization: user.organization,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/auth/switch-persona (Development & Demo convenience for testing multi-role workflows)
router.post('/switch-persona', async (req: Request, res: Response, next) => {
  try {
    const roleSchema = z.object({
      role: z.enum(['HOLDER', 'ISSUER', 'VERIFIER', 'ADMIN']),
    });
    const { role } = roleSchema.parse(req.body);

    // Find the seed user for this role
    const roleEmailMap = {
      ISSUER: 'registrar@helios-polytechnic.edu.test',
      HOLDER: 'elena.rostova@zeropass.local',
      VERIFIER: 'compliance@meridian-audit.corp.test',
      ADMIN: 'admin@zeropass.network',
    };

    const targetUser = await db.findUserByEmail(roleEmailMap[role]);
    if (!targetUser) {
      throw new AppError(`Seed profile for role ${role} not found`, 404, 'not-found');
    }

    const token = await createAuthToken(targetUser);
    res.json({
      message: `Switched active persona to ${targetUser.name}`,
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        did: targetUser.did,
        organization: targetUser.organization,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
