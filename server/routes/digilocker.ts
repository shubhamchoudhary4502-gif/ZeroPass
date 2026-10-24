import { Router, Request, Response } from 'express';
import { digiLockerProvider } from '../providers/digilocker';

const router = Router();

// GET /api/providers/digilocker/status - Check integration readiness & official checklist
router.get('/status', (req: Request, res: Response) => {
  res.json(digiLockerProvider.getStatus());
});

// GET /api/providers/digilocker/authorize - Safe guarded authorization URL endpoint
router.get('/authorize', (req: Request, res: Response) => {
  const result = digiLockerProvider.getAuthorizationUrl();
  if (result.error) {
    return res.status(403).json({
      status: 'DISABLED',
      message: result.error,
      requirements: [
        'Must register official organization entity on partners.digitallocker.gov.in',
        'Obtain MeitY API Setu client credentials and whitelisted production IP',
        'Configure OAuth 2.0 PKCE redirect with scope eaadhaar',
      ],
    });
  }
  res.json({ authorizationUrl: result.url });
});

export default router;
