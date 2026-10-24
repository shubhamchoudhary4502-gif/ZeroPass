import * as crypto from 'node:crypto';
import * as jose from 'jose';

// In-memory key store for development & server runtime
// In production, private keys reside in an HSM / Cloud KMS
interface KeyPairHolder {
  publicKeyJwk: jose.JWK;
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
}

let defaultIssuerKeys: KeyPairHolder | null = null;
let defaultHolderKeys: KeyPairHolder | null = null;

export async function getOrCreateIssuerKeys(): Promise<KeyPairHolder> {
  if (defaultIssuerKeys) return defaultIssuerKeys;

  // Generate Ed25519 keypair for issuer signing
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const jwk = await jose.exportJWK(publicKey);
  jwk.kid = 'did:zeropass:testnet:helios:reg78912#keys-1';
  jwk.use = 'sig';
  jwk.alg = 'EdDSA';

  defaultIssuerKeys = {
    publicKeyJwk: jwk,
    privateKey,
    publicKey,
  };
  return defaultIssuerKeys;
}

export async function getOrCreateHolderKeys(): Promise<KeyPairHolder> {
  if (defaultHolderKeys) return defaultHolderKeys;

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const jwk = await jose.exportJWK(publicKey);
  jwk.kid = 'did:zeropass:testnet:holder:elena99321#keys-1';
  jwk.use = 'sig';
  jwk.alg = 'EdDSA';

  defaultHolderKeys = {
    publicKeyJwk: jwk,
    privateKey,
    publicKey,
  };
  return defaultHolderKeys;
}

/**
 * Derives a deterministic DID key representation from a public JWK
 */
export function jwkToDid(jwk: jose.JWK, method: string = 'zeropass'): string {
  const hash = crypto.createHash('sha256').update(JSON.stringify(jwk)).digest('hex').slice(0, 16);
  return `did:${method}:${hash}`;
}
