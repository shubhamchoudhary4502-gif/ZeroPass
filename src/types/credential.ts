export type AttributeType = 'string' | 'number' | 'boolean' | 'date';

export interface SchemaAttribute {
  id: string;
  name: string;
  key: string;
  type: AttributeType;
  required: boolean;
  description: string;
}

export interface CredentialSchema {
  id: string;
  name: string;
  version: string;
  description: string;
  type: string;
  schemaUri: string;
  attributes: SchemaAttribute[];
  createdAt: string;
  issuerDid: string;
}

export type CredentialStatus = 'draft' | 'validating' | 'signed' | 'revoked' | 'expired';

export interface CredentialSubject {
  id: string; // Holder DID
  [claimKey: string]: any;
}

export interface CryptographicProof {
  type: 'ZeroPassSignature2026' | 'BbsBlsSignature2020' | 'Groth16ZkSnark';
  created: string;
  verificationMethod: string;
  proofPurpose: 'assertionMethod' | 'authentication';
  proofValue: string;
  stateRoot?: string;
  merkleIndex?: number;
}

export interface VerifiableCredential {
  id: string;
  context: string[];
  type: string[];
  schemaId: string;
  schemaName: string;
  issuer: {
    id: string;
    name: string;
    icon?: string;
    isTrusted: boolean;
  };
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: CredentialSubject;
  status: CredentialStatus;
  proof?: CryptographicProof;
  revocation?: {
    revoked: boolean;
    revocationTimestamp?: string;
    reason?: string;
    registryIndex?: number;
  };
}

export interface CredentialIssuanceRequest {
  schemaId: string;
  holderDid: string;
  claims: Record<string, any>;
  expirationMonths: number;
}
