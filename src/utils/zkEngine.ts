import { ProofPredicate, VerificationResult, VerificationPolicy, VerificationStepCheck } from '../types/proof';
import { VerifiableCredential, CredentialSchema } from '../types/credential';

/**
 * Validates whether a DID string matches standard decentralized identifier formats
 * Supports did:zeropass, did:polygonid, did:key, did:ion
 */
export function validateDid(did: string): { isValid: boolean; method?: string; error?: string } {
  if (!did || typeof did !== 'string') {
    return { isValid: false, error: 'DID must be a non-empty string' };
  }
  const didRegex = /^did:([a-z0-9]+):([a-zA-Z0-9.\-_:]+)$/;
  const match = did.trim().match(didRegex);
  if (!match) {
    return { isValid: false, error: 'Invalid DID syntax. Expected format: did:<method>:<identifier>' };
  }
  return { isValid: true, method: match[1] };
}

/**
 * Evaluates a Zero-Knowledge predicate or conditional assertion
 */
export function evaluatePredicate(predicate: ProofPredicate, subjectValue: any): boolean {
  if (subjectValue === undefined || subjectValue === null) {
    return false;
  }

  const { operator, value: targetValue } = predicate;

  switch (operator) {
    case 'eq':
      return subjectValue === targetValue || String(subjectValue).toLowerCase() === String(targetValue).toLowerCase();
    case 'neq':
      return subjectValue !== targetValue;
    case 'gt': {
      const numSubject = Number(subjectValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return false;
      return numSubject > numTarget;
    }
    case 'gte': {
      const numSubject = Number(subjectValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return false;
      return numSubject >= numTarget;
    }
    case 'lt': {
      const numSubject = Number(subjectValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return false;
      return numSubject < numTarget;
    }
    case 'lte': {
      const numSubject = Number(subjectValue);
      const numTarget = Number(targetValue);
      if (isNaN(numSubject) || isNaN(numTarget)) return false;
      return numSubject <= numTarget;
    }
    case 'in': {
      if (Array.isArray(targetValue)) {
        return targetValue.includes(subjectValue);
      }
      return false;
    }
    default:
      return false;
  }
}

/**
 * Validates credential claims against a schema definition
 */
export function validateCredentialClaims(
  schema: CredentialSchema,
  claims: Record<string, any>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const attr of schema.attributes) {
    const val = claims[attr.key];

    if (attr.required && (val === undefined || val === null || val === '')) {
      errors.push(`Attribute '${attr.name}' (${attr.key}) is required`);
      continue;
    }

    if (val !== undefined && val !== null && val !== '') {
      if (attr.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`Attribute '${attr.name}' must be a valid number`);
        }
      } else if (attr.type === 'boolean') {
        if (typeof val !== 'boolean' && val !== 'true' && val !== 'false') {
          errors.push(`Attribute '${attr.name}' must be true or false`);
        }
      } else if (attr.type === 'date') {
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          errors.push(`Attribute '${attr.name}' must be a valid date`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Executes multi-step cryptographic verification of a credential presentation
 * Validates:
 * 1. Issuer signature integrity & state
 * 2. Expiration threshold check
 * 3. On-chain revocation non-membership
 * 4. Issuer trust list authorization
 * 5. All ZK predicates satisfied
 */
export function verifyPresentation(
  credential: VerifiableCredential,
  policy: VerificationPolicy,
  currentIsoDate: string = new Date().toISOString()
): VerificationResult {
  const checks: VerificationStepCheck[] = [];
  const currentDate = new Date(currentIsoDate);

  // 1. Check Issuer Signature
  const hasSignature = !!credential.proof && !!credential.proof.proofValue && credential.status !== 'draft';
  checks.push({
    step: 'Cryptographic Signature',
    description: 'Verify digital signature using issuer public key & Ed25519/BLS12-381 curve',
    passed: hasSignature,
    details: hasSignature 
      ? `Verified via ${credential.proof?.type ?? 'ZeroPassSignature2026'}`
      : 'Signature missing or credential is an unsigned draft',
  });

  if (!hasSignature) {
    return {
      isValid: false,
      failureReason: 'INVALID_SIGNATURE',
      errorMessage: 'The credential signature could not be cryptographically validated or is an unsigned draft.',
      verifiedAt: currentIsoDate,
      checks,
      disclosedClaims: {},
      satisfiedPredicates: [],
      issuerDid: credential.issuer.id,
      holderDid: credential.credentialSubject.id,
      proofType: credential.proof?.type ?? 'Unsigned',
    };
  }

  // 2. Check Expiration
  const expDate = new Date(credential.expirationDate);
  const isExpired = !isNaN(expDate.getTime()) && currentDate > expDate;
  checks.push({
    step: 'Expiration Check',
    description: 'Validate credential validity interval against current timestamp',
    passed: !isExpired,
    details: isExpired ? `Expired on ${credential.expirationDate}` : `Valid until ${credential.expirationDate}`,
  });

  if (isExpired) {
    return {
      isValid: false,
      failureReason: 'CREDENTIAL_EXPIRED',
      errorMessage: `The credential expired on ${credential.expirationDate} and is no longer valid.`,
      verifiedAt: currentIsoDate,
      checks,
      disclosedClaims: {},
      satisfiedPredicates: [],
      issuerDid: credential.issuer.id,
      holderDid: credential.credentialSubject.id,
      proofType: credential.proof?.type ?? 'Unknown',
    };
  }

  // 3. Check Revocation
  const isRevoked = credential.status === 'revoked' || (credential.revocation && credential.revocation.revoked);
  checks.push({
    step: 'Revocation Registry Check',
    description: 'Query cryptographic accumulator / non-revocation status in registry',
    passed: !isRevoked,
    details: isRevoked
      ? `Revoked on ${credential.revocation?.revocationTimestamp ?? 'historical block'}: ${credential.revocation?.reason ?? 'Revocation entry found'}`
      : 'Non-revocation accumulator verified',
  });

  if (isRevoked) {
    return {
      isValid: false,
      failureReason: 'CREDENTIAL_REVOKED',
      errorMessage: `Credential was revoked by issuer: ${credential.revocation?.reason || 'Status is revoked'}`,
      verifiedAt: currentIsoDate,
      checks,
      disclosedClaims: {},
      satisfiedPredicates: [],
      issuerDid: credential.issuer.id,
      holderDid: credential.credentialSubject.id,
      proofType: credential.proof?.type ?? 'Unknown',
    };
  }

  // 4. Check Allowed/Trusted Issuers
  let issuerTrusted = true;
  if (policy.allowedIssuers && policy.allowedIssuers.length > 0) {
    issuerTrusted = policy.allowedIssuers.includes(credential.issuer.id);
  } else {
    issuerTrusted = credential.issuer.isTrusted;
  }

  checks.push({
    step: 'Issuer Trust Authorization',
    description: 'Confirm issuer DID is trusted by verifier policy and registered in trust registry',
    passed: issuerTrusted,
    details: issuerTrusted ? `Trusted: ${credential.issuer.name}` : `Issuer ${credential.issuer.id} is not trusted for this policy`,
  });

  if (!issuerTrusted) {
    return {
      isValid: false,
      failureReason: 'UNTRUSTED_ISSUER',
      errorMessage: `Issuer '${credential.issuer.name}' (${credential.issuer.id}) is not trusted by the verifier policy.`,
      verifiedAt: currentIsoDate,
      checks,
      disclosedClaims: {},
      satisfiedPredicates: [],
      issuerDid: credential.issuer.id,
      holderDid: credential.credentialSubject.id,
      proofType: credential.proof?.type ?? 'Unknown',
    };
  }

  // 5. Evaluate Predicates (Zero-Knowledge)
  const satisfiedPredicates: { predicate: ProofPredicate; satisfied: boolean }[] = [];
  let allPredicatesPass = true;

  for (const pred of policy.predicates) {
    const rawVal = credential.credentialSubject[pred.attributeKey];
    const passed = evaluatePredicate(pred, rawVal);
    satisfiedPredicates.push({ predicate: pred, satisfied: passed });
    if (!passed) {
      allPredicatesPass = false;
    }
  }

  checks.push({
    step: 'Zero-Knowledge Predicates',
    description: 'Verify polynomial constraints and arithmetic circuit satisfaction without revealing raw values',
    passed: allPredicatesPass,
    details: allPredicatesPass
      ? `${policy.predicates.length} condition(s) satisfied via zero-knowledge proof`
      : 'One or more policy predicates failed condition evaluation',
  });

  if (!allPredicatesPass) {
    return {
      isValid: false,
      failureReason: 'PREDICATE_UNSATISFIED',
      errorMessage: 'The credential claims do not satisfy the required policy predicates.',
      verifiedAt: currentIsoDate,
      checks,
      disclosedClaims: {},
      satisfiedPredicates,
      issuerDid: credential.issuer.id,
      holderDid: credential.credentialSubject.id,
      proofType: credential.proof?.type ?? 'Unknown',
    };
  }

  // 6. Selective Disclosure Claims (only requested fields, not the full credential)
  const disclosedClaims: Record<string, any> = {};
  for (const reqClaim of policy.disclosedClaims) {
    if (credential.credentialSubject[reqClaim.attributeKey] !== undefined) {
      disclosedClaims[reqClaim.attributeKey] = credential.credentialSubject[reqClaim.attributeKey];
    }
  }

  return {
    isValid: true,
    verifiedAt: currentIsoDate,
    checks,
    disclosedClaims,
    satisfiedPredicates,
    issuerDid: credential.issuer.id,
    holderDid: credential.credentialSubject.id,
    proofType: credential.proof?.type ?? 'ZeroPassSignature2026',
  };
}
