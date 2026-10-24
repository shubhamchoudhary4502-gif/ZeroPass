export type UserRole = 'ISSUER' | 'HOLDER' | 'VERIFIER' | 'ADMIN';

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  did: string;
  organization?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbIssuer {
  id: string;
  name: string;
  did: string;
  category: string;
  trustStatus: string;
  verificationMethod: string;
  supportedCredentialTypes: string[];
  website: string;
  description: string;
  publicKeyJwk: any;
  activeCredentialsIssued: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbCredentialSchema {
  id: string;
  name: string;
  version: string;
  type: string;
  description: string;
  schemaUri: string;
  attributes: Array<{
    id: string;
    name: string;
    key: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required: boolean;
    description: string;
  }>;
  issuerDid: string;
  createdAt: string;
}

export interface DbCredential {
  id: string;
  schemaId: string;
  schemaName: string;
  type: string;
  issuerDid: string;
  issuerName: string;
  holderDid: string;
  issuanceDate: string;
  expirationDate: string;
  status: 'SIGNED' | 'DRAFT' | 'REVOKED' | 'EXPIRED';
  claims: Record<string, any>;
  jwtVc?: string;
  proofType: string;
  proofValue: string;
  merkleIndex?: number;
  revoked: boolean;
  revokedAt?: string;
  revocationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbVerificationPolicy {
  id: string;
  title: string;
  description: string;
  credentialType: string;
  schemaId: string;
  allowedIssuers?: string[];
  predicates: Array<{
    attributeKey: string;
    attributeLabel: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
    value: any;
    isZeroKnowledge: boolean;
  }>;
  disclosedClaims: Array<{
    attributeKey: string;
    attributeLabel: string;
    required: boolean;
    selectiveDisclosureAllowed: boolean;
  }>;
  verifierDid: string;
  createdAt: string;
}

export interface DbVerificationSession {
  id: string;
  policyId: string;
  status: 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  verifierDid: string;
  verifierName: string;
  qrPayload: string;
  expiresAt: string;
  result?: any;
  createdAt: string;
}

export interface DbPresentationRecord {
  id: string;
  timestamp: string;
  verifierName: string;
  verifierDid: string;
  holderDid: string;
  credentialId: string;
  credentialTitle: string;
  claimsDisclosed: string[];
  predicatesProved: string[];
  status: 'APPROVED' | 'REJECTED';
  presentationToken?: string;
  createdAt: string;
}

export interface DbApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED';
  lastUsedAt?: string;
  createdAt: string;
}

export interface DbWebhook {
  id: string;
  url: string;
  description: string;
  events: string[];
  secretToken: string;
  isActive: boolean;
  lastDeliveryStatus?: string;
  lastDeliveryAt?: string;
  createdAt: string;
}

export interface DbVerificationLog {
  id: string;
  timestamp: string;
  requestId: string;
  verifierName: string;
  credentialType: string;
  result: 'SUCCESS' | 'FAILED';
  failureReason?: string;
  latencyMs: number;
  ipAddress: string;
}
