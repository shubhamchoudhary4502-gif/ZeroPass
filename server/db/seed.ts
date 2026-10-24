import bcrypt from 'bcryptjs';
import { DbUser, DbIssuer, DbCredentialSchema, DbCredential, DbVerificationPolicy, DbVerificationSession, DbPresentationRecord, DbApiKey, DbWebhook, DbVerificationLog } from './types';
import { signVerifiableCredential } from '../crypto/w3cJwtVc';

export async function createInitialSeedData(): Promise<{
  users: DbUser[];
  issuers: DbIssuer[];
  schemas: DbCredentialSchema[];
  credentials: DbCredential[];
  policies: DbVerificationPolicy[];
  sessions: DbVerificationSession[];
  presentations: DbPresentationRecord[];
  apiKeys: DbApiKey[];
  webhooks: DbWebhook[];
  logs: DbVerificationLog[];
}> {
  // Passwords hashed with bcrypt
  const passwordHash = await bcrypt.hash('ZeroPass#2026!Demo', 10);

  const users: DbUser[] = [
    {
      id: 'usr_issuer_01',
      email: 'registrar@helios-polytechnic.edu.test',
      passwordHash,
      name: 'Helios Polytechnic Registry',
      role: 'ISSUER',
      did: 'did:zeropass:testnet:helios:reg78912',
      organization: 'Helios Polytechnic Institute (Fictional Test Anchor)',
      createdAt: '2026-01-15T09:00:00Z',
      updatedAt: '2026-01-15T09:00:00Z',
    },
    {
      id: 'usr_holder_01',
      email: 'elena.rostova@zeropass.local',
      passwordHash,
      name: 'Elena Rostova',
      role: 'HOLDER',
      did: 'did:zeropass:testnet:holder:elena99321',
      createdAt: '2026-02-10T14:30:00Z',
      updatedAt: '2026-02-10T14:30:00Z',
    },
    {
      id: 'usr_verifier_01',
      email: 'compliance@meridian-audit.corp.test',
      passwordHash,
      name: 'Meridian Capital Compliance',
      role: 'VERIFIER',
      did: 'did:zeropass:testnet:verifier:meridian441',
      organization: 'Meridian Capital Compliance (Sandbox Verifier)',
      createdAt: '2026-03-01T11:00:00Z',
      updatedAt: '2026-03-01T11:00:00Z',
    },
    {
      id: 'usr_admin_01',
      email: 'admin@zeropass.network',
      passwordHash,
      name: 'Platform Administrator',
      role: 'ADMIN',
      did: 'did:zeropass:testnet:admin:root001',
      organization: 'ZeroPass Core Protocol Authority',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const issuers: DbIssuer[] = [
    {
      id: 'iss_helios',
      name: 'Helios Polytechnic Institute',
      did: 'did:zeropass:testnet:helios:reg78912',
      category: 'Education',
      trustStatus: 'ACCREDITED_INSTITUTION',
      verificationMethod: 'On-chain State Contract',
      supportedCredentialTypes: ['StudentStatusCredential', 'ScholarshipEligibilityCredential'],
      website: 'https://helios-polytechnic.edu.test',
      description: 'Fictional accredited technical university participating in ZeroPass sandbox credentialing.',
      publicKeyJwk: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: '3a829f01bc74e92a838df20b48a129048a120489',
      },
      activeCredentialsIssued: 3420,
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'iss_civickey',
      name: 'CivicKey Digital Authority',
      did: 'did:zeropass:testnet:civic:authority552',
      category: 'Government & Civic',
      trustStatus: 'VERIFIED_TRUST_ANCHOR',
      verificationMethod: 'X.509 PKI Trust Anchor',
      supportedCredentialTypes: ['AgeEligibilityCredential'],
      website: 'https://civickey-sandbox.org.test',
      description: 'Fictional civic testnet identity issuer testing privacy-preserving age verification.',
      publicKeyJwk: {
        kty: 'OKP',
        crv: 'Ed25519',
        x: '17c9b0e2714a8f9024cba8103e91d84f092318ab',
      },
      activeCredentialsIssued: 14890,
      createdAt: '2026-01-05T12:00:00Z',
      updatedAt: '2026-01-05T12:00:00Z',
    },
  ];

  const schemas: DbCredentialSchema[] = [
    {
      id: 'schema_age_eligibility_v1',
      name: 'Age & Adult Eligibility',
      version: '1.2.0',
      type: 'AgeEligibilityCredential',
      description: 'Cryptographic proof of legal age threshold without revealing date of birth.',
      schemaUri: 'https://schema.zeropass.network/v1/AgeEligibilityCredential.json',
      issuerDid: 'did:zeropass:testnet:civic:authority552',
      createdAt: '2026-01-10T10:00:00Z',
      attributes: [
        { id: 'a1', name: 'Legal Full Name', key: 'fullName', type: 'string', required: true, description: 'Subject legal name' },
        { id: 'a2', name: 'Age', key: 'age', type: 'number', required: true, description: 'Current age in completed years' },
        { id: 'a3', name: 'Date of Birth', key: 'birthDate', type: 'date', required: true, description: 'Full date of birth' },
        { id: 'a4', name: 'Jurisdiction Code', key: 'jurisdiction', type: 'string', required: true, description: 'ISO country/region code' },
      ],
    },
    {
      id: 'schema_student_status_v2',
      name: 'Higher Education Student Status',
      version: '2.0.1',
      type: 'StudentStatusCredential',
      description: 'Verifies active university enrollment and student discount eligibility.',
      schemaUri: 'https://schema.zeropass.network/v2/StudentStatusCredential.json',
      issuerDid: 'did:zeropass:testnet:helios:reg78912',
      createdAt: '2026-01-20T12:00:00Z',
      attributes: [
        { id: 's1', name: 'Student Name', key: 'studentName', type: 'string', required: true, description: 'Enrolled student name' },
        { id: 's2', name: 'Student ID Number', key: 'studentId', type: 'string', required: true, description: 'Institutional ID' },
        { id: 's3', name: 'Enrollment Status', key: 'enrollmentStatus', type: 'string', required: true, description: 'ACTIVE | GRADUATED' },
        { id: 's4', name: 'Degree Level', key: 'degreeLevel', type: 'string', required: true, description: 'Undergraduate | Graduate' },
        { id: 's5', name: 'Graduation Year', key: 'graduationYear', type: 'number', required: true, description: 'Anticipated completion year' },
      ],
    },
    {
      id: 'schema_scholarship_v1',
      name: 'Merit Scholarship Eligibility',
      version: '1.0.0',
      type: 'ScholarshipEligibilityCredential',
      description: 'Proves scholarship award qualification and family income eligibility thresholds.',
      schemaUri: 'https://schema.zeropass.network/v1/ScholarshipEligibilityCredential.json',
      issuerDid: 'did:zeropass:testnet:helios:reg78912',
      createdAt: '2026-02-01T15:30:00Z',
      attributes: [
        { id: 'sc1', name: 'Recipient Name', key: 'recipientName', type: 'string', required: true, description: 'Award recipient' },
        { id: 'sc2', name: 'Award Category', key: 'awardCategory', type: 'string', required: true, description: 'STEM Excellence | Merit' },
        { id: 'sc3', name: 'Annual Income', key: 'annualIncome', type: 'number', required: true, description: 'Household income in USD' },
        { id: 'sc4', name: 'Minimum GPA Met', key: 'gpaThresholdMet', type: 'boolean', required: true, description: 'Satisfies GPA requirement' },
      ],
    },
  ];

  // Cryptographically sign seed credentials using real Ed25519 JWT VC!
  const signedStudentVc = await signVerifiableCredential({
    issuerDid: 'did:zeropass:testnet:helios:reg78912',
    holderDid: 'did:zeropass:testnet:holder:elena99321',
    schemaUri: 'https://schema.zeropass.network/v2/StudentStatusCredential.json',
    credentialTypes: ['StudentStatusCredential'],
    claims: {
      studentName: 'Elena Rostova',
      studentId: 'HP-2024-9104',
      enrollmentStatus: 'ACTIVE',
      degreeLevel: 'Graduate',
      graduationYear: 2027,
    },
    expirationDate: new Date('2028-01-22T08:00:00Z'),
  });

  const signedAgeVc = await signVerifiableCredential({
    issuerDid: 'did:zeropass:testnet:civic:authority552',
    holderDid: 'did:zeropass:testnet:holder:elena99321',
    schemaUri: 'https://schema.zeropass.network/v1/AgeEligibilityCredential.json',
    credentialTypes: ['AgeEligibilityCredential'],
    claims: {
      fullName: 'Elena Rostova',
      age: 24,
      birthDate: '2002-04-18',
      jurisdiction: 'US-CA',
    },
    expirationDate: new Date('2029-01-12T10:00:00Z'),
  });

  const credentials: DbCredential[] = [
    {
      id: 'urn:uuid:cred-student-8812',
      schemaId: 'schema_student_status_v2',
      schemaName: 'Higher Education Student Status',
      type: 'StudentStatusCredential',
      issuerDid: 'did:zeropass:testnet:helios:reg78912',
      issuerName: 'Helios Polytechnic Institute (Fictional Test Anchor)',
      holderDid: 'did:zeropass:testnet:holder:elena99321',
      issuanceDate: '2026-01-22T08:00:00Z',
      expirationDate: '2028-01-22T08:00:00Z',
      status: 'SIGNED',
      claims: {
        studentName: 'Elena Rostova',
        studentId: 'HP-2024-9104',
        enrollmentStatus: 'ACTIVE',
        degreeLevel: 'Graduate',
        graduationYear: 2027,
      },
      jwtVc: signedStudentVc.jwtVc,
      proofType: 'Ed25519Signature2020',
      proofValue: signedStudentVc.proofValue,
      merkleIndex: 42,
      revoked: false,
      createdAt: '2026-01-22T08:00:00Z',
      updatedAt: '2026-01-22T08:00:00Z',
    },
    {
      id: 'urn:uuid:cred-age-4401',
      schemaId: 'schema_age_eligibility_v1',
      schemaName: 'Age & Adult Eligibility',
      type: 'AgeEligibilityCredential',
      issuerDid: 'did:zeropass:testnet:civic:authority552',
      issuerName: 'CivicKey Digital Authority (Testnet Issuer)',
      holderDid: 'did:zeropass:testnet:holder:elena99321',
      issuanceDate: '2026-01-12T10:00:00Z',
      expirationDate: '2029-01-12T10:00:00Z',
      status: 'SIGNED',
      claims: {
        fullName: 'Elena Rostova',
        age: 24,
        birthDate: '2002-04-18',
        jurisdiction: 'US-CA',
      },
      jwtVc: signedAgeVc.jwtVc,
      proofType: 'Ed25519Signature2020',
      proofValue: signedAgeVc.proofValue,
      merkleIndex: 114,
      revoked: false,
      createdAt: '2026-01-12T10:00:00Z',
      updatedAt: '2026-01-12T10:00:00Z',
    },
    {
      id: 'urn:uuid:cred-draft-1102',
      schemaId: 'schema_student_status_v2',
      schemaName: 'Higher Education Student Status',
      type: 'StudentStatusCredential',
      issuerDid: 'did:zeropass:testnet:helios:reg78912',
      issuerName: 'Helios Polytechnic Institute (Fictional Test Anchor)',
      holderDid: 'did:zeropass:testnet:holder:marcus2210',
      issuanceDate: '2026-03-01T10:00:00Z',
      expirationDate: '2027-03-01T10:00:00Z',
      status: 'DRAFT', // Unsigned Draft
      claims: {
        studentName: 'Marcus Vance',
        studentId: 'HP-2025-1011',
        enrollmentStatus: 'ACTIVE',
        degreeLevel: 'Undergraduate',
        graduationYear: 2029,
      },
      proofType: 'Unsigned',
      proofValue: '',
      revoked: false,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'urn:uuid:cred-revoked-9901',
      schemaId: 'schema_student_status_v2',
      schemaName: 'Higher Education Student Status',
      type: 'StudentStatusCredential',
      issuerDid: 'did:zeropass:testnet:helios:reg78912',
      issuerName: 'Helios Polytechnic Institute (Fictional Test Anchor)',
      holderDid: 'did:zeropass:testnet:holder:tarik501',
      issuanceDate: '2025-09-01T08:00:00Z',
      expirationDate: '2027-09-01T08:00:00Z',
      status: 'REVOKED', // Revoked
      claims: {
        studentName: 'Tarik Al-Mansoor',
        studentId: 'HP-2023-4100',
        enrollmentStatus: 'DISENROLLED',
      },
      proofType: 'Ed25519Signature2020',
      proofValue: '0x3344192804b719024f8d70142b918304910a28f73b192804c71829f034b71829',
      merkleIndex: 12,
      revoked: true,
      revokedAt: '2026-02-14T16:22:00Z',
      revocationReason: 'Subject withdrew from academic degree program on 2026-02-14',
      createdAt: '2025-09-01T08:00:00Z',
      updatedAt: '2026-02-14T16:22:00Z',
    },
  ];

  const policies: DbVerificationPolicy[] = [
    {
      id: 'policy_adult_18_zk',
      title: 'Adult Access Verification (18+)',
      description: 'Requires zero-knowledge proof that subject age >= 18 and jurisdiction is verified, without revealing date of birth.',
      credentialType: 'AgeEligibilityCredential',
      schemaId: 'schema_age_eligibility_v1',
      allowedIssuers: ['did:zeropass:testnet:civic:authority552'],
      predicates: [
        {
          attributeKey: 'age',
          attributeLabel: 'Age Requirement',
          operator: 'gte',
          value: 18,
          isZeroKnowledge: true,
        },
      ],
      disclosedClaims: [
        {
          attributeKey: 'jurisdiction',
          attributeLabel: 'Jurisdiction Code',
          required: true,
          selectiveDisclosureAllowed: true,
        },
      ],
      verifierDid: 'did:zeropass:testnet:verifier:meridian441',
      createdAt: '2026-02-01T10:00:00Z',
    },
    {
      id: 'policy_active_student_discount',
      title: 'Student Discount & Transit Card',
      description: 'Verifies active enrollment status and graduation year without disclosing student ID, GPA, or transcript.',
      credentialType: 'StudentStatusCredential',
      schemaId: 'schema_student_status_v2',
      predicates: [
        {
          attributeKey: 'enrollmentStatus',
          attributeLabel: 'Enrollment Status',
          operator: 'eq',
          value: 'ACTIVE',
          isZeroKnowledge: false,
        },
        {
          attributeKey: 'graduationYear',
          attributeLabel: 'Active Student Year',
          operator: 'gte',
          value: 2026,
          isZeroKnowledge: true,
        },
      ],
      disclosedClaims: [
        {
          attributeKey: 'studentName',
          attributeLabel: 'Student Name',
          required: true,
          selectiveDisclosureAllowed: false,
        },
        {
          attributeKey: 'degreeLevel',
          attributeLabel: 'Degree Level',
          required: false,
          selectiveDisclosureAllowed: true,
        },
      ],
      verifierDid: 'did:zeropass:testnet:verifier:meridian441',
      createdAt: '2026-02-10T11:30:00Z',
    },
  ];

  const sessions: DbVerificationSession[] = [
    {
      id: 'sess_live_init_9921',
      policyId: 'policy_adult_18_zk',
      status: 'PENDING',
      verifierDid: 'did:zeropass:testnet:verifier:meridian441',
      verifierName: 'Meridian Capital Compliance (Sandbox Verifier)',
      qrPayload: 'zeropass://verify?session=sess_live_init_9921&policy=policy_adult_18_zk',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const presentations: DbPresentationRecord[] = [
    {
      id: 'pres_001',
      timestamp: '2026-03-02T16:20:00Z',
      verifierName: 'City Transit Authority',
      verifierDid: 'did:zeropass:testnet:verifier:transit99',
      holderDid: 'did:zeropass:testnet:holder:elena99321',
      credentialId: 'urn:uuid:cred-student-8812',
      credentialTitle: 'Higher Education Student Status',
      claimsDisclosed: ['studentName', 'degreeLevel'],
      predicatesProved: ['enrollmentStatus == ACTIVE', 'graduationYear >= 2026 (ZK)'],
      status: 'APPROVED',
      createdAt: '2026-03-02T16:20:00Z',
    },
  ];

  const apiKeys: DbApiKey[] = [
    {
      id: 'key_live_01',
      name: 'Production Verifier Microservice',
      keyPrefix: 'zp_live_948a',
      keyHash: await bcrypt.hash('zp_live_948a90124f8d70142b918304910a28f73b19', 10),
      scopes: ['verification:verify', 'credentials:read'],
      status: 'ACTIVE',
      lastUsedAt: '2026-03-03T18:22:00Z',
      createdAt: '2026-01-20T10:00:00Z',
    },
  ];

  const webhooks: DbWebhook[] = [
    {
      id: 'wh_01',
      url: 'https://api.meridian-audit.corp.test/webhooks/zeropass',
      description: 'Audit service notifications for completed proof presentations',
      events: ['proof.verified', 'proof.failed'],
      secretToken: 'whsec_8849b2c890124f8d70142b91830491',
      isActive: true,
      lastDeliveryStatus: 'success',
      lastDeliveryAt: '2026-03-03T18:22:04Z',
      createdAt: '2026-02-05T12:00:00Z',
    },
  ];

  const logs: DbVerificationLog[] = [
    {
      id: 'log_01',
      timestamp: '2026-03-03T18:22:04Z',
      requestId: 'req_v8892_10',
      verifierName: 'Meridian Capital Compliance',
      credentialType: 'AgeEligibilityCredential',
      result: 'SUCCESS',
      latencyMs: 142,
      ipAddress: '198.51.100.42',
    },
  ];

  return {
    users,
    issuers,
    schemas,
    credentials,
    policies,
    sessions,
    presentations,
    apiKeys,
    webhooks,
    logs,
  };
}
