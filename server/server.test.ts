import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServerApp } from '../server';
import { db } from './db/repository';
import { signVerifiableCredential, verifyVerifiableCredential, signVerifiablePresentation, verifyVerifiablePresentation } from './crypto/w3cJwtVc';
import { evaluatePredicateCondition, calculateAgeFromBirthDate, extractSelectivelyDisclosedClaims } from './crypto/selectiveDisclosure';
import { RevocationAccumulator } from './crypto/accumulator';

let server: http.Server;
let baseUrl: string;

before(async () => {
  process.env.NODE_ENV = 'test';
  const app = await createServerApp();
  
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    if (typeof (server as any).closeAllConnections === 'function') {
      (server as any).closeAllConnections();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Health: /api/health returns 200 and system readiness', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'healthy');
  assert.equal(data.database, 'connected');
  assert.equal(typeof data.timestamp, 'string');
});

test('Auth: Register new user, hash password, and generate valid DID', async () => {
  const testEmail = `tester-${Date.now()}@example.com`;
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123!',
      name: 'Integration Tester',
      role: 'HOLDER',
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.token);
  assert.equal(body.user.email, testEmail);
  assert.equal(body.user.role, 'HOLDER');
  assert.ok(body.user.did.startsWith('did:zeropass:'));
  // Ensure sensitive password hash is never leaked
  assert.equal(body.user.passwordHash, undefined);
});

test('Auth: Reject duplicate email registration with 409 Conflict', async () => {
  const duplicateEmail = 'elena.rostova@zeropass.local';
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: duplicateEmail,
      password: 'AnyPassword123!',
      name: 'Elena Duplicate',
      role: 'HOLDER',
    }),
  });

  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.status, 409);
});

test('Auth: Login with valid credentials returns Bearer JWT', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'elena.rostova@zeropass.local',
      password: 'ZeroPass#2026!Demo',
    }),
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.equal(body.user.email, 'elena.rostova@zeropass.local');
  assert.equal(body.user.role, 'HOLDER');
});

test('Auth: Login with invalid password returns 401 with Problem Details', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'elena.rostova@zeropass.local',
      password: 'WrongPassword!',
    }),
  });

  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.status, 401);
  assert.ok(body.detail.includes('Invalid email or password'));
});

test('Auth: /api/auth/me enforces Bearer token authentication', async () => {
  // Without token -> 401
  const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
  assert.equal(unauthRes.status, 401);

  // Login as admin
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@zeropass.network',
      password: 'ZeroPass#2026!Demo',
    }),
  });
  const { token } = await loginRes.json();

  // With valid token -> 200
  const authRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(authRes.status, 200);
  const data = await authRes.json();
  assert.equal(data.user.email, 'admin@zeropass.network');
  assert.equal(data.user.role, 'ADMIN');
});

test('Auth: /api/auth/switch-persona issues authenticated token for specified role', async () => {
  const res = await fetch(`${baseUrl}/api/auth/switch-persona`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'ISSUER' }),
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.equal(body.user.role, 'ISSUER');
  assert.equal(body.user.email, 'registrar@helios-polytechnic.edu.test');
});

test('RBAC: Non-issuer (HOLDER) cannot issue credentials (403 Forbidden)', async () => {
  // Login as Holder
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'elena.rostova@zeropass.local',
      password: 'ZeroPass#2026!Demo',
    }),
  });
  const { token } = await loginRes.json();

  // Attempt to issue credential
  const issueRes = await fetch(`${baseUrl}/api/credentials/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schemaId: 'schema_student_status_v2',
      holderDid: 'did:zeropass:testnet:holder:elena99321',
      claims: {
        studentName: 'Elena Rostova',
        studentId: 'HP-2024-9104',
        enrollmentStatus: 'ACTIVE',
        degreeLevel: 'Graduate',
        graduationYear: 2027,
      },
      expirationDays: 30,
    }),
  });

  assert.equal(issueRes.status, 403);
  const errBody = await issueRes.json();
  assert.equal(errBody.status, 403);
});

test('RBAC & Issuance: Authorized ISSUER can successfully issue an Ed25519-signed W3C VC', async () => {
  // Login as Issuer
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'registrar@helios-polytechnic.edu.test',
      password: 'ZeroPass#2026!Demo',
    }),
  });
  const { token } = await loginRes.json();

  const issueRes = await fetch(`${baseUrl}/api/credentials/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schemaId: 'schema_student_status_v2',
      holderDid: 'did:zeropass:testnet:holder:elena99321',
      claims: {
        studentName: 'Elena Rostova',
        studentId: 'HP-2024-9104',
        enrollmentStatus: 'ACTIVE',
        degreeLevel: 'Graduate',
        graduationYear: 2027,
      },
      expirationDays: 90,
    }),
  });

  assert.equal(issueRes.status, 201);
  const { credential } = await issueRes.json();
  assert.ok(credential.id);
  assert.ok(credential.jwtVc);
  assert.equal(credential.status, 'SIGNED');
  assert.ok(credential.proofValue.startsWith('0x'));

  // Cryptographically verify the issued JWT VC
  const verifyResult = await verifyVerifiableCredential(credential.jwtVc);
  assert.equal(verifyResult.isValid, true);
  assert.equal(verifyResult.payload.vc.credentialSubject.studentName, 'Elena Rostova');
});

test('Cross-User Data Isolation: Holder cannot view another user private credential (403)', async () => {
  // Register a separate holder
  const separateHolderEmail = `private-holder-${Date.now()}@test.local`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: separateHolderEmail,
      password: 'SecurePassword123!',
      name: 'Separate Holder',
      role: 'HOLDER',
    }),
  });
  const { token } = await regRes.json();

  // Try to access Elena's credential urn:uuid:cred-student-8812
  const getRes = await fetch(`${baseUrl}/api/credentials/urn:uuid:cred-student-8812`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(getRes.status, 403);
});

test('Cryptography: Tampered W3C VC signature is rejected', async () => {
  const vc = await signVerifiableCredential({
    issuerDid: 'did:zeropass:testnet:issuer:test',
    holderDid: 'did:zeropass:testnet:holder:test',
    schemaUri: 'https://schema.zeropass.network/v1/TestSchema.json',
    credentialTypes: ['TestCredential'],
    claims: { score: 98 },
    expirationDate: new Date(Date.now() + 86400000),
  });

  // Tamper with payload
  const parts = vc.jwtVc.split('.');
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], 'base64url').toString()), score: 100 })
  ).toString('base64url');
  const tamperedJwt = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

  const verifyResult = await verifyVerifiableCredential(tamperedJwt);
  assert.equal(verifyResult.isValid, false);
  assert.equal(verifyResult.error, 'INVALID_SIGNATURE');
});

test('Cryptography: Expired credential is rejected', async () => {
  const expiredVc = await signVerifiableCredential({
    issuerDid: 'did:zeropass:testnet:issuer:test',
    holderDid: 'did:zeropass:testnet:holder:test',
    schemaUri: 'https://schema.zeropass.network/v1/TestSchema.json',
    credentialTypes: ['TestCredential'],
    claims: { score: 50 },
    expirationDate: new Date(Date.now() - 3600000), // Expired 1 hour ago
  });

  const verifyResult = await verifyVerifiableCredential(expiredVc.jwtVc);
  assert.equal(verifyResult.isValid, false);
  assert.equal(verifyResult.error, 'CREDENTIAL_EXPIRED');
});

test('Verifiable Presentation: Validates audience, nonce, and prevents replay attacks', async () => {
  const holderDid = 'did:zeropass:testnet:holder:elena';
  const verifierDid = 'did:zeropass:testnet:verifier:meridian';
  const nonce = 'valid-nonce-challenge-987';

  const vc = await signVerifiableCredential({
    issuerDid: 'did:zeropass:testnet:issuer:test',
    holderDid,
    schemaUri: 'https://schema.zeropass.network/v1/TestSchema.json',
    credentialTypes: ['TestCredential'],
    claims: { active: true },
    expirationDate: new Date(Date.now() + 86400000),
  });

  const vpJwt = await signVerifiablePresentation({
    holderDid,
    verifierDid,
    nonce,
    verifiableCredentials: [vc.jwtVc],
  });

  // Matches audience and nonce
  const resultValid = await verifyVerifiablePresentation(vpJwt, verifierDid, nonce);
  assert.equal(resultValid.isValid, true);

  // Mismatched nonce (replay attempt with stale challenge)
  const resultReplay = await verifyVerifiablePresentation(vpJwt, verifierDid, 'stale-different-nonce');
  assert.equal(resultReplay.isValid, false);
  assert.equal(resultReplay.error, 'INVALID_NONCE_REPLAY_ATTACK');

  // Mismatched verifier audience
  const resultAudience = await verifyVerifiablePresentation(vpJwt, 'did:zeropass:testnet:verifier:wrong', nonce);
  assert.equal(resultAudience.isValid, false);
});

test('Selective Disclosure & Predicates: Calendar age evaluation and claim minimization', () => {
  const testRef = new Date('2026-10-24T12:00:00Z');
  // Born 2008-10-25 -> Has not reached 18th birthday yet
  assert.equal(calculateAgeFromBirthDate('2008-10-25', testRef), 17);
  // Born 2008-10-24 -> Exactly 18 today
  assert.equal(calculateAgeFromBirthDate('2008-10-24', testRef), 18);
  // Born 2000-01-01 -> 26
  assert.equal(calculateAgeFromBirthDate('2000-01-01', testRef), 26);

  // Age Predicate derivation from birthDate
  const claimsWithBirthDate = {
    fullName: 'Elena Rostova',
    birthDate: '2002-04-18',
    secretHealthRecord: 'CONFIDENTIAL',
  };

  const predicateGte18 = {
    attributeKey: 'age',
    attributeLabel: 'Minimum Age 18',
    operator: 'gte' as const,
    value: 18,
    isZeroKnowledge: true,
  };

  const evalResult = evaluatePredicateCondition(predicateGte18, claimsWithBirthDate, testRef);
  assert.equal(evalResult.satisfied, true);
  assert.equal(evalResult.evaluatedValue, '[ZK PROVEN]');

  // Selective disclosure: only allowed keys revealed, confidential health data NEVER leaked
  const disclosed = extractSelectivelyDisclosedClaims(claimsWithBirthDate, ['fullName']);
  assert.deepEqual(disclosed, { fullName: 'Elena Rostova' });
  assert.equal((disclosed as any).secretHealthRecord, undefined);
  assert.equal((disclosed as any).birthDate, undefined);
});

test('Cryptographic Accumulator: Revocation updates state root and isRevoked query', () => {
  const accumulator = new RevocationAccumulator([1, 2]);
  const rootBefore = accumulator.getStateRoot();
  assert.equal(accumulator.isRevoked(1), true);
  assert.equal(accumulator.isRevoked(5), false);

  const { newStateRoot } = accumulator.revoke(5);
  assert.notEqual(newStateRoot, rootBefore);
  assert.equal(accumulator.isRevoked(5), true);
  assert.equal(accumulator.getStateRoot(), newStateRoot);
});

test('Verification Pipeline: Rejects revoked credentials with CREDENTIAL_REVOKED', async () => {
  const revokedCred = await db.findCredentialById('urn:uuid:cred-revoked-9901');
  assert.ok(revokedCred);
  assert.equal(revokedCred.status, 'REVOKED');

  // Create verification session for policy_active_student_discount
  const sessionRes = await fetch(`${baseUrl}/api/verification-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policyId: 'policy_active_student_discount' }),
  });
  const { session } = await sessionRes.json();

  // Attempt verification with the revoked credential
  const verifyRes = await fetch(`${baseUrl}/api/verifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session.id,
      credentialId: revokedCred.id,
    }),
  });

  assert.equal(verifyRes.status, 200);
  const { result } = await verifyRes.json();
  assert.equal(result.isValid, false);
  assert.equal(result.failureReason, 'CREDENTIAL_REVOKED');
});

test('Centralized Error Handling: Input validation catches invalid schemas (400 Problem Details)', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-email-format',
      password: '123', // shorter than 8 chars
      name: '',
    }),
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.status, 400);
  assert.equal(body.title, 'Validation Failed');
  assert.ok(Array.isArray(body.errors));
});
