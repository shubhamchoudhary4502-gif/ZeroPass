import * as jose from 'jose';
import * as crypto from 'node:crypto';
import { getOrCreateIssuerKeys, getOrCreateHolderKeys } from './keys';

export interface SignVcParams {
  issuerDid: string;
  holderDid: string;
  schemaUri: string;
  credentialTypes: string[];
  claims: Record<string, any>;
  expirationDate: Date;
  issuanceDate?: Date;
}

export interface IssuedW3cCredential {
  jwtVc: string;
  id: string;
  proofValue: string;
  payload: any;
}

/**
 * Creates and cryptographically signs a W3C Verifiable Credential as an EdDSA (Ed25519) JWT
 */
export async function signVerifiableCredential(params: SignVcParams): Promise<IssuedW3cCredential> {
  const issuerKeys = await getOrCreateIssuerKeys();
  const id = `urn:uuid:${crypto.randomUUID()}`;
  const issuanceDate = params.issuanceDate || new Date();

  const payload = {
    iss: params.issuerDid,
    sub: params.holderDid,
    jti: id,
    nbf: Math.floor(issuanceDate.getTime() / 1000),
    exp: Math.floor(params.expirationDate.getTime() / 1000),
    vc: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        params.schemaUri,
      ],
      id,
      type: ['VerifiableCredential', ...params.credentialTypes],
      issuer: {
        id: params.issuerDid,
      },
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: params.expirationDate.toISOString(),
      credentialSubject: {
        id: params.holderDid,
        ...params.claims,
      },
    },
  };

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({
      alg: 'EdDSA',
      typ: 'JWT',
      kid: `${params.issuerDid}#keys-1`,
    })
    .sign(issuerKeys.privateKey);

  // Extract signature portion for audit
  const signaturePart = jwt.split('.')[2];
  const proofValue = `0x${Buffer.from(signaturePart, 'base64url').toString('hex')}`;

  return {
    jwtVc: jwt,
    id,
    proofValue,
    payload,
  };
}

/**
 * Cryptographically verifies a signed JWT Verifiable Credential
 */
export async function verifyVerifiableCredential(
  jwtVc: string,
  expectedIssuerPublicKeyJwk?: jose.JWK
): Promise<{ isValid: boolean; payload?: any; error?: string }> {
  try {
    const issuerKeys = await getOrCreateIssuerKeys();
    const keyToUse = expectedIssuerPublicKeyJwk
      ? await jose.importJWK(expectedIssuerPublicKeyJwk, 'EdDSA')
      : issuerKeys.publicKey;

    const { payload } = await jose.jwtVerify(jwtVc, keyToUse, {
      algorithms: ['EdDSA'],
    });

    // Check expiration timestamp
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { isValid: false, error: 'CREDENTIAL_EXPIRED' };
    }

    return { isValid: true, payload };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.code === 'ERR_JWT_EXPIRED' ? 'CREDENTIAL_EXPIRED' : 'INVALID_SIGNATURE',
    };
  }
}

/**
 * Creates and signs a W3C Verifiable Presentation (VP)
 * Binds the presentation to a specific verifier nonce/challenge and audience to prevent replay attacks
 */
export async function signVerifiablePresentation(params: {
  holderDid: string;
  verifierDid: string;
  nonce: string;
  verifiableCredentials: string[]; // JWT VCs
}): Promise<string> {
  const holderKeys = await getOrCreateHolderKeys();
  const id = `urn:uuid:${crypto.randomUUID()}`;

  const payload = {
    iss: params.holderDid,
    sub: params.holderDid,
    aud: params.verifierDid,
    nonce: params.nonce,
    jti: id,
    vp: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: params.verifiableCredentials,
    },
  };

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({
      alg: 'EdDSA',
      typ: 'JWT',
      kid: `${params.holderDid}#keys-1`,
    })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(holderKeys.privateKey);

  return jwt;
}

/**
 * Verifies a Verifiable Presentation JWT
 */
export async function verifyVerifiablePresentation(
  presentationJwt: string,
  expectedAudience: string,
  expectedNonce: string
): Promise<{ isValid: boolean; payload?: any; error?: string }> {
  try {
    const holderKeys = await getOrCreateHolderKeys();
    const { payload } = await jose.jwtVerify(presentationJwt, holderKeys.publicKey, {
      audience: expectedAudience,
      algorithms: ['EdDSA'],
    });

    if (payload.nonce !== expectedNonce) {
      return { isValid: false, error: 'INVALID_NONCE_REPLAY_ATTACK' };
    }

    return { isValid: true, payload };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'INVALID_PRESENTATION_SIGNATURE' };
  }
}
