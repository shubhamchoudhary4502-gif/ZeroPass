import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './server/config/env';
import { requestLogger } from './server/middleware/logger';
import { errorHandler } from './server/middleware/errorHandler';
import authRoutes from './server/routes/auth';
import issuerRoutes from './server/routes/issuers';
import schemaRoutes from './server/routes/schemas';
import credentialRoutes from './server/routes/credentials';
import verificationRoutes from './server/routes/verifications';
import developerRoutes from './server/routes/developer';
import digilockerRoutes from './server/routes/digilocker';
import blockchainRoutes from './server/routes/blockchain';
import healthRoutes from './server/routes/health';
import { db } from './server/db/repository';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServerApp() {
  const app = express();

  // Initialize persistent database
  await db.init();

  // Core Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  // Mount API Endpoints
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/issuers', issuerRoutes);
  app.use('/api/schemas', schemaRoutes);
  app.use('/api/credentials', credentialRoutes);
  app.use('/api', verificationRoutes);
  app.use('/api/developer', developerRoutes);
  app.use('/api/providers/digilocker', digilockerRoutes);
  app.use('/api/blockchain', blockchainRoutes);

  // Centralized Error Handling for all routes
  app.use(errorHandler);

  return app;
}

async function startServer() {
  const app = await createServerApp();
  const PORT = parseInt(env.PORT || '3000', 10);

  // In development, mount Vite's connect instance as middleware.
  // In production, serve the pre-built dist folder.
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZeroPass Core Service] Ready on http://0.0.0.0:${PORT} (PID ${process.pid})`);
  });
}

const isDirectRun = Boolean(process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')));

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Fatal startup error in ZeroPass server:', err);
    process.exit(1);
  });
}

