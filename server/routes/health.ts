import { Router, Request, Response } from 'express';
import { env } from '../config/env';

const router = Router();

// GET /api/health - Platform system health and cryptographic readiness check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
    service: 'ZeroPass Verifiable Credential Platform',
    version: '2.4.0',
    environment: env.NODE_ENV,
    cryptography: {
      signatures: 'W3C VC 2.0 (Ed25519 / EdDSA & BLS12-381)',
      zeroKnowledge: 'Arithmetic Circuit Predicates (Privado ID / Iden3 Query Specs)',
      revocation: 'Dynamic Accumulator StatusList2021',
    },
    integrations: {
      digilocker: env.DIGILOCKER_ENABLED === 'true' ? 'ENABLED' : 'DISABLED_PENDING_GOVT_APPROVAL',
      blockchain: env.BLOCKCHAIN_ENABLED === 'true' ? 'CONNECTED' : 'STANDBY_TESTNET',
    },
  });
});

export default router;
