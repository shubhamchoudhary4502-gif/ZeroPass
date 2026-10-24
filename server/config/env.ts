import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(16).default('zeropass_dev_jwt_secret_minimum_32_characters_for_security_hs256'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  ISSUER_DID: z.string().default('did:zeropass:testnet:helios:reg78912'),
  DIGILOCKER_ENABLED: z.string().default('false'),
  DIGILOCKER_CLIENT_ID: z.string().optional(),
  DIGILOCKER_CLIENT_SECRET: z.string().optional(),
  DIGILOCKER_REDIRECT_URI: z.string().optional(),
  BLOCKCHAIN_ENABLED: z.string().default('false'),
  BLOCKCHAIN_RPC_URL: z.string().default('https://rpc-amoy.polygon.technology'),
  BLOCKCHAIN_REGISTRY_ADDRESS: z.string().default('0x0000000000000000000000000000000000000000'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
