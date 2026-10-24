import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { db } from '../db/repository';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/developer/keys - List API keys (masked)
router.get('/keys', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const keys = await db.getApiKeys();
    res.json({ keys });
  } catch (err) {
    next(err);
  }
});

const createKeySchema = z.object({
  name: z.string().min(2),
  scopes: z.array(z.string()).min(1),
});

// POST /api/developer/keys - Generate scoped API key (Returns secret ONCE)
router.post('/keys', authenticate, requireRole('ADMIN', 'ISSUER', 'VERIFIER'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { name, scopes } = createKeySchema.parse(req.body);

    const secretRandom = crypto.randomBytes(24).toString('hex');
    const fullSecretKey = `zp_live_${secretRandom}`;
    const keyPrefix = fullSecretKey.slice(0, 12);
    const keyHash = await bcrypt.hash(fullSecretKey, 10);

    const key = await db.createApiKey({
      id: `key_${Date.now().toString(36)}`,
      name,
      keyPrefix,
      keyHash,
      scopes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'API Key generated successfully. Save this secret key now as it cannot be shown again.',
      key: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes,
        status: key.status,
        createdAt: key.createdAt,
      },
      secretKey: fullSecretKey,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/developer/keys/:id - Revoke API key
router.delete('/keys/:id', authenticate, requireRole('ADMIN', 'ISSUER', 'VERIFIER'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const success = await db.revokeApiKey(req.params.id);
    if (!success) {
      throw new AppError('API key not found', 404, 'not-found');
    }
    res.json({ message: 'API key revoked successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/developer/webhooks - List webhooks
router.get('/webhooks', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const webhooks = await db.getWebhooks();
    res.json({ webhooks });
  } catch (err) {
    next(err);
  }
});

const createWebhookSchema = z.object({
  url: z.string().url(),
  description: z.string().default(''),
  events: z.array(z.string()).min(1),
});

// POST /api/developer/webhooks - Register webhook
router.post('/webhooks', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createWebhookSchema.parse(req.body);
    const secretToken = `whsec_${crypto.randomBytes(20).toString('hex')}`;

    const webhook = await db.createWebhook({
      id: `wh_${Date.now().toString(36)}`,
      url: data.url,
      description: data.description,
      events: data.events,
      secretToken,
      isActive: true,
      lastDeliveryStatus: 'success',
      lastDeliveryAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Webhook configured successfully',
      webhook,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/developer/logs - Query verification request audit logs
router.get('/logs', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const logs = await db.getLogs();
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

export default router;
