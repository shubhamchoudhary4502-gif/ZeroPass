import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/repository';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/issuers - List trusted credential issuers
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const issuers = await db.getIssuers();
    res.json({ issuers });
  } catch (err) {
    next(err);
  }
});

// GET /api/issuers/:did - Retrieve issuer profile by DID
router.get('/:did', async (req: Request, res: Response, next) => {
  try {
    const issuer = await db.findIssuerByDid(req.params.did);
    if (!issuer) {
      throw new AppError('Issuer not found', 404, 'not-found');
    }
    res.json({ issuer });
  } catch (err) {
    next(err);
  }
});

const createIssuerSchema = z.object({
  name: z.string().min(2),
  did: z.string().startsWith('did:'),
  category: z.string(),
  trustStatus: z.enum([
    'VERIFIED_TRUST_ANCHOR',
    'ACCREDITED_INSTITUTION',
    'REGISTERED_ENTERPRISE',
    'COMMUNITY_VERIFIED',
  ]),
  verificationMethod: z.string(),
  supportedCredentialTypes: z.array(z.string()).min(1),
  website: z.string().url(),
  description: z.string(),
  publicKeyJwk: z.record(z.string(), z.any()),
});

// POST /api/issuers - Register new issuer (Requires ADMIN)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createIssuerSchema.parse(req.body);
    const existing = await db.findIssuerByDid(data.did);
    if (existing) {
      throw new AppError('Issuer with this DID is already registered.', 409, 'conflict');
    }

    const issuer = await db.createIssuer({
      id: `iss_${Date.now().toString(36)}`,
      ...data,
      activeCredentialsIssued: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Issuer registered to trust directory', issuer });
  } catch (err) {
    next(err);
  }
});

export default router;
