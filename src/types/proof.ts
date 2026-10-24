export type PredicateOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';

export interface ProofPredicate {
  attributeKey: string;
  attributeLabel: string;
  operator: PredicateOperator;
  value: any;
  isZeroKnowledge: boolean; // if true, holder proves condition holds without disclosing value
}

export interface RequestedClaim {
  attributeKey: string;
  attributeLabel: string;
  required: boolean;
  selectiveDisclosureAllowed: boolean;
}

export interface VerificationPolicy {
  id: string;
  title: string;
  description: string;
  credentialType: string;
  schemaId: string;
  allowedIssuers?: string[]; // Trusted issuer DIDs
  predicates: ProofPredicate[];
  disclosedClaims: RequestedClaim[];
  createdAt: string;
}

export interface ProofSession {
  sessionId: string;
  policy: VerificationPolicy;
  status: 'pending' | 'received' | 'verified' | 'failed' | 'expired';
  verifierDid: string;
  verifierName: string;
  callbackUrl?: string;
  qrPayload: string;
  createdAt: string;
  expiresAt: string;
  result?: VerificationResult;
}

export type VerificationFailureReason = 
  | 'INVALID_SIGNATURE'
  | 'PREDICATE_UNSATISFIED'
  | 'CREDENTIAL_REVOKED'
  | 'CREDENTIAL_EXPIRED'
  | 'UNTRUSTED_ISSUER'
  | 'SCHEMA_MISMATCH'
  | 'TAMPERED_PROOF';

export interface VerificationStepCheck {
  step: string;
  description: string;
  passed: boolean;
  details?: string;
}

export interface VerificationResult {
  isValid: boolean;
  failureReason?: VerificationFailureReason;
  errorMessage?: string;
  verifiedAt: string;
  checks: VerificationStepCheck[];
  disclosedClaims: Record<string, any>;
  satisfiedPredicates: {
    predicate: ProofPredicate;
    satisfied: boolean;
  }[];
  issuerDid: string;
  holderDid: string;
  proofType: string;
}

export interface PresentationRecord {
  id: string;
  timestamp: string;
  verifierName: string;
  verifierDid: string;
  credentialTitle: string;
  claimsDisclosed: string[];
  predicatesProved: string[];
  status: 'approved' | 'rejected';
}
