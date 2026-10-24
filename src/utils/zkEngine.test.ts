import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDid, evaluatePredicate, verifyPresentation } from './zkEngine';
import { VerifiableCredential } from '../types/credential';
import { VerificationPolicy } from '../types/proof';

test('validateDid accepts valid decentralized identifiers', () => {
  assert.equal(validateDid('did:zeropass:0x93427abc4235ef98').isValid, true);
  assert.equal(validateDid('did:polygonid:polygon:amoy:2enVwBw6').isValid, true);
  assert.equal(validateDid('did:key:z6MkhaXgBZDvotDkL5257faiz4zZBCG41356').isValid, true);
});

test('validateDid rejects invalid DID strings', () => {
  assert.equal(validateDid('').isValid, false);
  assert.equal(validateDid('not-a-did').isValid, false);
  assert.equal(validateDid('did:').isValid, false);
});

test('evaluatePredicate evaluates comparison operators correctly', () => {
  // GTE
  assert.equal(evaluatePredicate({ attributeKey: 'age', attributeLabel: 'Age', operator: 'gte', value: 18, isZeroKnowledge: true }, 21), true);
  assert.equal(evaluatePredicate({ attributeKey: 'age', attributeLabel: 'Age', operator: 'gte', value: 18, isZeroKnowledge: true }, 18), true);
  assert.equal(evaluatePredicate({ attributeKey: 'age', attributeLabel: 'Age', operator: 'gte', value: 18, isZeroKnowledge: true }, 17), false);

  // LT
  assert.equal(evaluatePredicate({ attributeKey: 'income', attributeLabel: 'Income', operator: 'lt', value: 300000, isZeroKnowledge: true }, 150000), true);
  assert.equal(evaluatePredicate({ attributeKey: 'income', attributeLabel: 'Income', operator: 'lt', value: 300000, isZeroKnowledge: true }, 350000), false);

  // EQ
  assert.equal(evaluatePredicate({ attributeKey: 'status', attributeLabel: 'Status', operator: 'eq', value: 'ACTIVE', isZeroKnowledge: true }, 'ACTIVE'), true);
  assert.equal(evaluatePredicate({ attributeKey: 'status', attributeLabel: 'Status', operator: 'eq', value: 'ACTIVE', isZeroKnowledge: true }, 'SUSPENDED'), false);

  // IN
  assert.equal(evaluatePredicate({ attributeKey: 'country', attributeLabel: 'Country', operator: 'in', value: ['US', 'CA', 'GB'], isZeroKnowledge: true }, 'CA'), true);
  assert.equal(evaluatePredicate({ attributeKey: 'country', attributeLabel: 'Country', operator: 'in', value: ['US', 'CA', 'GB'], isZeroKnowledge: true }, 'FR'), false);
});

test('verifyPresentation passes on valid credential and selectively discloses only requested claims', () => {
  const credential: VerifiableCredential = {
    id: 'urn:uuid:cred-01',
    context: ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'AgeEligibilityCredential'],
    schemaId: 'schema-age-01',
    schemaName: 'Age Eligibility Credential',
    issuer: {
      id: 'did:zeropass:issuer-gov',
      name: 'Department of Digital Records',
      isTrusted: true,
    },
    issuanceDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2028-01-01T00:00:00.000Z',
    status: 'signed',
    credentialSubject: {
      id: 'did:zeropass:holder-alice',
      fullName: 'Alice Johnson',
      birthDate: '1998-05-12',
      age: 28,
      citizenship: 'US',
      ssnLast4: '4921',
    },
    proof: {
      type: 'ZeroPassSignature2026',
      created: '2026-01-01T00:00:00.000Z',
      verificationMethod: 'did:zeropass:issuer-gov#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: '0x3a829f01bc74e92a838df2',
    },
  };

  const policy: VerificationPolicy = {
    id: 'policy-over-18',
    title: 'Adult Age Gate (18+)',
    description: 'Verify holder is at least 18 without learning birthdate or SSN',
    credentialType: 'AgeEligibilityCredential',
    schemaId: 'schema-age-01',
    predicates: [
      {
        attributeKey: 'age',
        attributeLabel: 'Age',
        operator: 'gte',
        value: 18,
        isZeroKnowledge: true,
      },
    ],
    disclosedClaims: [
      {
        attributeKey: 'citizenship',
        attributeLabel: 'Citizenship',
        required: true,
        selectiveDisclosureAllowed: true,
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const result = verifyPresentation(credential, policy, '2026-06-01T00:00:00.000Z');
  assert.equal(result.isValid, true);
  // Privacy check: only 'citizenship' disclosed! 'birthDate', 'age', 'ssnLast4' NOT in disclosedClaims
  assert.equal(result.disclosedClaims.citizenship, 'US');
  assert.equal(result.disclosedClaims.birthDate, undefined);
  assert.equal(result.disclosedClaims.ssnLast4, undefined);
  assert.equal(result.disclosedClaims.age, undefined);
  assert.equal(result.satisfiedPredicates.length, 1);
  assert.equal(result.satisfiedPredicates[0].satisfied, true);
});

test('verifyPresentation rejects unsigned draft credential', () => {
  const credential: VerifiableCredential = {
    id: 'urn:uuid:cred-draft',
    context: ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'StudentCredential'],
    schemaId: 'schema-student-01',
    schemaName: 'Student Status',
    issuer: {
      id: 'did:zeropass:issuer-uni',
      name: 'State Tech University',
      isTrusted: true,
    },
    issuanceDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2028-01-01T00:00:00.000Z',
    status: 'draft', // Draft!
    credentialSubject: {
      id: 'did:zeropass:holder-bob',
      isEnrolled: true,
    },
  };

  const policy: VerificationPolicy = {
    id: 'policy-student',
    title: 'Student Discount',
    description: 'Verify student enrollment',
    credentialType: 'StudentCredential',
    schemaId: 'schema-student-01',
    predicates: [],
    disclosedClaims: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const result = verifyPresentation(credential, policy);
  assert.equal(result.isValid, false);
  assert.equal(result.failureReason, 'INVALID_SIGNATURE');
});

test('verifyPresentation rejects expired credential', () => {
  const credential: VerifiableCredential = {
    id: 'urn:uuid:cred-exp',
    context: ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'AgeEligibilityCredential'],
    schemaId: 'schema-age-01',
    schemaName: 'Age Eligibility',
    issuer: {
      id: 'did:zeropass:issuer-gov',
      name: 'Gov Authority',
      isTrusted: true,
    },
    issuanceDate: '2024-01-01T00:00:00.000Z',
    expirationDate: '2025-01-01T00:00:00.000Z', // Expired
    status: 'signed',
    credentialSubject: {
      id: 'did:zeropass:holder-alice',
      age: 25,
    },
    proof: {
      type: 'ZeroPassSignature2026',
      created: '2024-01-01T00:00:00.000Z',
      verificationMethod: 'did:zeropass:issuer-gov#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: '0x9923847',
    },
  };

  const policy: VerificationPolicy = {
    id: 'policy-age',
    title: 'Age Check',
    description: 'Check age',
    credentialType: 'AgeEligibilityCredential',
    schemaId: 'schema-age-01',
    predicates: [],
    disclosedClaims: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const result = verifyPresentation(credential, policy, '2026-06-01T00:00:00.000Z');
  assert.equal(result.isValid, false);
  assert.equal(result.failureReason, 'CREDENTIAL_EXPIRED');
});

test('verifyPresentation rejects revoked credential', () => {
  const credential: VerifiableCredential = {
    id: 'urn:uuid:cred-rev',
    context: ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'StudentCredential'],
    schemaId: 'schema-student-01',
    schemaName: 'Student Status',
    issuer: {
      id: 'did:zeropass:issuer-uni',
      name: 'State Tech University',
      isTrusted: true,
    },
    issuanceDate: '2026-01-01T00:00:00.000Z',
    expirationDate: '2028-01-01T00:00:00.000Z',
    status: 'revoked',
    revocation: {
      revoked: true,
      reason: 'Student graduated early',
      revocationTimestamp: '2026-03-01T00:00:00.000Z',
    },
    credentialSubject: {
      id: 'did:zeropass:holder-bob',
      isEnrolled: true,
    },
    proof: {
      type: 'ZeroPassSignature2026',
      created: '2026-01-01T00:00:00.000Z',
      verificationMethod: 'did:zeropass:issuer-uni#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: '0x88231',
    },
  };

  const policy: VerificationPolicy = {
    id: 'policy-student',
    title: 'Student Discount',
    description: 'Verify student',
    credentialType: 'StudentCredential',
    schemaId: 'schema-student-01',
    predicates: [],
    disclosedClaims: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const result = verifyPresentation(credential, policy, '2026-06-01T00:00:00.000Z');
  assert.equal(result.isValid, false);
  assert.equal(result.failureReason, 'CREDENTIAL_REVOKED');
});
