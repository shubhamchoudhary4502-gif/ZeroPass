export type TrustStatus = 'VERIFIED_TRUST_ANCHOR' | 'ACCREDITED_INSTITUTION' | 'REGISTERED_ENTERPRISE' | 'COMMUNITY_VERIFIED';

export interface TrustedIssuer {
  id: string;
  name: string;
  did: string;
  category: 'Education' | 'Government & Civic' | 'Financial & Corporate' | 'Healthcare' | 'Certification Body';
  trustStatus: TrustStatus;
  verificationMethod: 'On-chain State Contract' | 'DID Document Registry' | 'X.509 PKI Trust Anchor';
  supportedCredentialTypes: string[];
  website: string;
  description: string;
  establishedDate: string;
  publicKeyFingerprint: string;
  activeCredentialsIssued: number;
}

export interface IssuerStatistics {
  totalIssued: number;
  activeCredentials: number;
  revokedCredentials: number;
  activeSchemas: number;
  verificationSuccessRate: number; // e.g. 99.4
}
