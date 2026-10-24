import { Router, Request, Response } from 'express';
import { blockchainProvider } from '../providers/blockchain';

const router = Router();

// GET /api/blockchain/status - Status commitment & on-chain verification configuration
router.get('/status', (req: Request, res: Response) => {
  res.json(blockchainProvider.getStatus());
});

export default router;
