import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/repository';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/schemas - List all schemas
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const schemas = await db.getSchemas();
    res.json({ schemas });
  } catch (err) {
    next(err);
  }
});

// GET /api/schemas/:id - Retrieve schema by ID
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const schema = await db.findSchemaById(req.params.id);
    if (!schema) {
      throw new AppError('Schema not found', 404, 'not-found');
    }
    res.json({ schema });
  } catch (err) {
    next(err);
  }
});

const attributeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  key: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'date']),
  required: z.boolean(),
  description: z.string().optional().default(''),
});

const createSchemaInput = z.object({
  name: z.string().min(2),
  version: z.string().default('1.0.0'),
  type: z.string().min(2),
  description: z.string().default(''),
  attributes: z.array(attributeSchema).min(1, 'A schema must define at least one attribute'),
});

// POST /api/schemas - Register a new credential schema (Requires ISSUER or ADMIN)
router.post('/', authenticate, requireRole('ISSUER', 'ADMIN'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const data = createSchemaInput.parse(req.body);
    const existing = await db.findSchemaByType(data.type);
    if (existing) {
      throw new AppError(`A schema for credential type '${data.type}' already exists.`, 409, 'conflict');
    }

    const schemaId = `schema_${data.type.toLowerCase().replace(/credential$/i, '')}_v${data.version.replace(/\./g, '_')}`;

    const schema = await db.createSchema({
      id: schemaId,
      name: data.name,
      version: data.version,
      type: data.type,
      description: data.description,
      schemaUri: `https://schema.zeropass.network/v1/${data.type}.json`,
      attributes: data.attributes.map((a, idx) => ({
        ...a,
        id: a.id || `attr_${Date.now()}_${idx}`,
      })),
      issuerDid: req.user!.did,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Credential schema registered successfully', schema });
  } catch (err) {
    next(err);
  }
});

export default router;
