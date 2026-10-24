import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/repository';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { signVerifiableCredential } from '../crypto/w3cJwtVc';
import { globalRevocationRegistry } from '../crypto/accumulator';

const router = Router();

// GET /api/credentials - List credentials with RBAC & cross-user privacy protection
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    let credentials;

    if (user.role === 'ADMIN') {
      credentials = await db.getCredentials();
    } else if (user.role === 'ISSUER') {
      credentials = await db.getCredentials({ issuerDid: user.did });
    } else {
      // HOLDER or VERIFIER: strictly return credentials where holderDid matches the authenticated user DID
      credentials = await db.getCredentials({ holderDid: user.did });
    }

    res.json({ credentials });
  } catch (err) {
    next(err);
  }
});

// GET /api/credentials/:id - Retrieve single credential (protected against unauthorized snooping)
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const credential = await db.findCredentialById(req.params.id);

    if (!credential) {
      throw new AppError('Credential not found', 404, 'not-found');
    }

    // Access control: only the holder, the issuer, or an admin may view full credential
    const isOwner = credential.holderDid === user.did;
    const isIssuer = credential.issuerDid === user.did;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isIssuer && !isAdmin) {
      throw new AppError('Forbidden. You do not have permission to view this credential.', 403, 'forbidden');
    }

    res.json({ credential });
  } catch (err) {
    next(err);
  }
});

const issueCredentialInput = z.object({
  schemaId: z.string(),
  holderDid: z.string().startsWith('did:', 'Holder must be a valid decentralized identifier (DID)'),
  claims: z.record(z.string(), z.any()),
  expirationDays: z.number().int().min(1).max(3650).optional(),
  expirationMonths: z.number().int().min(1).max(120).default(12),
  saveAsDraft: z.boolean().default(false),
});

const handleIssueCredential = async (req: AuthenticatedRequest, res: Response, next: any) => {
  try {
    const user = req.user!;
    const data = issueCredentialInput.parse(req.body);

    const schema = await db.findSchemaById(data.schemaId);
    if (!schema) {
      throw new AppError(`Credential schema '${data.schemaId}' not found.`, 404, 'schema-not-found');
    }

    // Validate claims against schema requirements
    const validationErrors: string[] = [];
    for (const attr of schema.attributes) {
      const val = data.claims[attr.key];
      if (attr.required && (val === undefined || val === null || val === '')) {
        validationErrors.push(`Required attribute '${attr.name}' (${attr.key}) is missing.`);
      }

      if (val !== undefined && val !== null && val !== '') {
        if (attr.type === 'number' && isNaN(Number(val))) {
          validationErrors.push(`Attribute '${attr.name}' must be a valid number.`);
        } else if (attr.type === 'date' && isNaN(new Date(String(val)).getTime())) {
          validationErrors.push(`Attribute '${attr.name}' must be a valid ISO date.`);
        }
      }
    }

    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(' '), 400, 'validation-error', { errors: validationErrors });
    }

    const issuanceDate = new Date();
    const expirationDate = new Date();
    if (data.expirationDays) {
      expirationDate.setDate(expirationDate.getDate() + data.expirationDays);
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + data.expirationMonths);
    }

    const issuerName = user.organization || user.name;
    const issuerDid = user.did;

    if (data.saveAsDraft) {
      // Unsigned Draft
      const draftCred = await db.createCredential({
        id: `urn:uuid:${crypto.randomUUID()}`,
        schemaId: schema.id,
        schemaName: schema.name,
        type: schema.type,
        issuerDid,
        issuerName,
        holderDid: data.holderDid,
        issuanceDate: issuanceDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        status: 'DRAFT',
        claims: data.claims,
        proofType: 'UnsignedDraft',
        proofValue: '',
        revoked: false,
        createdAt: issuanceDate.toISOString(),
        updatedAt: issuanceDate.toISOString(),
      });

      return res.status(201).json({
        message: 'Draft credential saved without cryptographic signature',
        credential: draftCred,
      });
    }

    // Cryptographically sign W3C Verifiable Credential using maintained jose Ed25519 (EdDSA)
    const signedVc = await signVerifiableCredential({
      issuerDid,
      holderDid: data.holderDid,
      schemaUri: schema.schemaUri,
      credentialTypes: [schema.type],
      claims: data.claims,
      issuanceDate,
      expirationDate,
    });

    const merkleIndex = Math.floor(Math.random() * 500) + 10;

    const credential = await db.createCredential({
      id: signedVc.id,
      schemaId: schema.id,
      schemaName: schema.name,
      type: schema.type,
      issuerDid,
      issuerName,
      holderDid: data.holderDid,
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      status: 'SIGNED',
      claims: data.claims,
      jwtVc: signedVc.jwtVc,
      proofType: 'Ed25519Signature2020',
      proofValue: signedVc.proofValue,
      merkleIndex,
      revoked: false,
      createdAt: issuanceDate.toISOString(),
      updatedAt: issuanceDate.toISOString(),
    });

    res.status(201).json({
      message: 'Credential cryptographically signed and issued',
      credential,
    });
  } catch (err) {
    next(err);
  }
};

router.post('/', authenticate, requireRole('ISSUER', 'ADMIN'), handleIssueCredential);
router.post('/issue', authenticate, requireRole('ISSUER', 'ADMIN'), handleIssueCredential);

const revokeSchema = z.object({
  reason: z.string().min(3, 'Reason for revocation is required'),
});

// POST /api/credentials/:id/revoke - Revoke issued credential on registry & accumulator
router.post('/:id/revoke', authenticate, requireRole('ISSUER', 'ADMIN'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const user = req.user!;
    const { reason } = revokeSchema.parse(req.body);

    const credential = await db.findCredentialById(req.params.id);
    if (!credential) {
      throw new AppError('Credential not found', 404, 'not-found');
    }

    // Only the issuing authority or platform admin can revoke
    if (credential.issuerDid !== user.did && user.role !== 'ADMIN') {
      throw new AppError('Forbidden. Only the issuing authority can revoke this credential.', 403, 'forbidden');
    }

    if (credential.revoked) {
      throw new AppError('Credential has already been revoked.', 400, 'already-revoked');
    }

    // Update on-chain / cryptographic accumulator
    if (credential.merkleIndex) {
      globalRevocationRegistry.revoke(credential.merkleIndex);
    }

    const updated = await db.revokeCredential(credential.id, reason);
    res.json({
      message: 'Credential successfully revoked on registry',
      credential: updated,
      newAccumulatorStateRoot: globalRevocationRegistry.getStateRoot(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
