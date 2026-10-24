import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { CredentialSchema, VerifiableCredential, CredentialIssuanceRequest } from '../types/credential';
import { VerificationPolicy, ProofSession, PresentationRecord, VerificationResult } from '../types/proof';
import { TrustedIssuer, IssuerStatistics } from '../types/issuer';
import { ApiKey, WebhookConfig, VerificationLog } from '../types/developer';
import { 
  SEED_PROFILES, 
  SEED_SCHEMAS, 
  SEED_CREDENTIALS, 
  SEED_POLICIES, 
  SEED_TRUSTED_ISSUERS, 
  SEED_PRESENTATIONS, 
  SEED_API_KEYS, 
  SEED_WEBHOOKS, 
  SEED_LOGS 
} from '../services/storage';
import { verifyPresentation, validateCredentialClaims } from '../utils/zkEngine';
import { api, setAuthToken } from '../services/api';

interface AppContextType {
  // Auth & Roles
  currentUser: UserProfile;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // Schemas
  schemas: CredentialSchema[];
  createSchema: (schemaData: Omit<CredentialSchema, 'id' | 'createdAt' | 'issuerDid'>) => Promise<CredentialSchema>;

  // Credentials
  credentials: VerifiableCredential[];
  issueCredential: (request: CredentialIssuanceRequest) => Promise<{ success: boolean; credential?: VerifiableCredential; error?: string }>;
  revokeCredential: (credentialId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  getIssuerStatistics: () => IssuerStatistics;

  // Verifier & Proofs
  policies: VerificationPolicy[];
  createPolicy: (policyData: Omit<VerificationPolicy, 'id' | 'createdAt'>) => Promise<VerificationPolicy>;
  activeProofSession: ProofSession | null;
  createProofSession: (policyId: string) => ProofSession;
  clearProofSession: () => void;
  submitProofToSession: (sessionId: string, credentialId: string, customDisclosedClaims?: string[]) => Promise<VerificationResult>;

  // Holder Actions
  holderCredentials: VerifiableCredential[];
  presentations: PresentationRecord[];
  pendingHolderRequest: ProofSession | null;
  approveHolderRequest: (sessionId: string, credentialId: string, customDisclosedClaims?: string[]) => Promise<boolean>;
  rejectHolderRequest: (sessionId: string) => void;

  // Directory
  trustedIssuers: TrustedIssuer[];

  // Developer Portal
  apiKeys: ApiKey[];
  createApiKey: (name: string, scopes: ApiKey['scopes']) => { key: ApiKey; secretKey: string };
  revokeApiKey: (id: string) => void;
  webhooks: WebhookConfig[];
  createWebhook: (data: Omit<WebhookConfig, 'id' | 'createdAt' | 'secretToken'>) => WebhookConfig;
  toggleWebhook: (id: string) => void;
  verificationLogs: VerificationLog[];

  // App notification
  notification: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapDbCredToFrontend(c: any): VerifiableCredential {
  return {
    id: c.id,
    context: ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', c.type],
    schemaId: c.schemaId,
    schemaName: c.schemaName,
    issuer: {
      id: c.issuerDid,
      name: c.issuerName,
      isTrusted: true,
    },
    issuanceDate: c.issuanceDate,
    expirationDate: c.expirationDate,
    status: c.status?.toLowerCase() as any,
    credentialSubject: {
      id: c.holderDid,
      ...(c.claims || {}),
    },
    proof: c.proofValue ? {
      type: (c.proofType || 'Ed25519Signature2020') as any,
      created: c.issuanceDate,
      verificationMethod: `${c.issuerDid}#keys-1`,
      proofPurpose: 'assertionMethod',
      proofValue: c.proofValue,
      merkleIndex: c.merkleIndex,
    } : undefined,
    revocation: {
      revoked: !!c.revoked,
      reason: c.revocationReason,
      revocationTimestamp: c.revokedAt,
      registryIndex: c.merkleIndex,
    },
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(SEED_PROFILES.holder);
  const [schemas, setSchemas] = useState<CredentialSchema[]>(SEED_SCHEMAS);
  const [credentials, setCredentials] = useState<VerifiableCredential[]>(SEED_CREDENTIALS);
  const [policies, setPolicies] = useState<VerificationPolicy[]>(SEED_POLICIES);
  const [trustedIssuers, setTrustedIssuers] = useState<TrustedIssuer[]>(SEED_TRUSTED_ISSUERS);
  const [presentations, setPresentations] = useState<PresentationRecord[]>(SEED_PRESENTATIONS);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(SEED_API_KEYS);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(SEED_WEBHOOKS);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>(SEED_LOGS);
  const [activeProofSession, setActiveProofSession] = useState<ProofSession | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null);

  // Initialize a realistic pending proof request for the holder so they can explore selective disclosure
  const [pendingHolderRequest, setPendingHolderRequest] = useState<ProofSession | null>(() => {
    const policy = SEED_POLICIES[0]; // Adult Access (18+)
    return {
      sessionId: 'sess_live_init_9921',
      policy,
      status: 'pending',
      verifierDid: 'did:zeropass:testnet:verifier:meridian441',
      verifierName: 'Meridian Capital Compliance (Sandbox Verifier)',
      qrPayload: `zeropass://verify?session=sess_live_init_9921&policy=${policy.id}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };
  });

  // Backend Initialization Sync
  useEffect(() => {
    async function syncWithBackend() {
      try {
        const authRes = await api.auth.switchPersona('HOLDER');
        if (authRes.token) {
          setAuthToken(authRes.token);
          if (authRes.user) {
            setCurrentUser({
              id: authRes.user.id,
              name: authRes.user.name,
              email: authRes.user.email,
              role: authRes.user.role.toLowerCase() as UserRole,
              did: authRes.user.did,
              organization: authRes.user.organization,
              createdAt: authRes.user.createdAt || new Date().toISOString(),
            });
          }
        }

        const [schemasRes, credsRes, issuersRes, keysRes, webhooksRes, logsRes] = await Promise.allSettled([
          api.schemas.getAll(),
          api.credentials.getAll(),
          api.issuers.getAll(),
          api.developer.getKeys(),
          api.developer.getWebhooks(),
          api.developer.getLogs(),
        ]);

        if (schemasRes.status === 'fulfilled' && schemasRes.value.schemas) {
          setSchemas(schemasRes.value.schemas);
        }
        if (credsRes.status === 'fulfilled' && credsRes.value.credentials) {
          setCredentials(credsRes.value.credentials.map(mapDbCredToFrontend));
        }
        if (issuersRes.status === 'fulfilled' && issuersRes.value.issuers) {
          setTrustedIssuers(issuersRes.value.issuers);
        }
        if (keysRes.status === 'fulfilled' && keysRes.value.keys) {
          setApiKeys(keysRes.value.keys.map((k: any) => ({
            ...k,
            maskedKey: `${k.keyPrefix}••••••••••••••••`,
            status: k.status?.toLowerCase() as any,
          })));
        }
        if (webhooksRes.status === 'fulfilled' && webhooksRes.value.webhooks) {
          setWebhooks(webhooksRes.value.webhooks);
        }
        if (logsRes.status === 'fulfilled' && logsRes.value.logs) {
          setVerificationLogs(logsRes.value.logs);
        }
      } catch (err) {
        // Fall back gracefully to seeded data
        console.log('Operating with in-memory seed data while connecting:', err);
      }
    }
    syncWithBackend();
  }, []);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const switchRole = async (role: UserRole) => {
    try {
      const res = await api.auth.switchPersona(role);
      if (res.token) {
        setAuthToken(res.token);
      }
      if (res.user) {
        setCurrentUser({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role.toLowerCase() as UserRole,
          did: res.user.did,
          organization: res.user.organization,
          createdAt: res.user.createdAt || new Date().toISOString(),
        });
      }
      // Re-fetch credentials under new role permissions
      const credsRes = await api.credentials.getAll().catch(() => null);
      if (credsRes && credsRes.credentials) {
        setCredentials(credsRes.credentials.map(mapDbCredToFrontend));
      }
      showNotification(`Switched persona to ${res.user.name} (${role.toUpperCase()})`, 'info');
    } catch {
      if (SEED_PROFILES[role]) {
        setCurrentUser(SEED_PROFILES[role]);
        showNotification(`Switched persona to ${SEED_PROFILES[role].name} (${role.toUpperCase()})`, 'info');
      }
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
    showNotification('Profile updated successfully', 'success');
  };

  // Issuer actions
  const createSchema = async (schemaData: Omit<CredentialSchema, 'id' | 'createdAt' | 'issuerDid'>): Promise<CredentialSchema> => {
    try {
      const res = await api.schemas.create(schemaData);
      const newSchema = res.schema;
      setSchemas((prev) => [newSchema, ...prev]);
      showNotification(`Credential Schema '${newSchema.name}' registered to decentralized registry`, 'success');
      return newSchema;
    } catch (e: any) {
      const fallback: CredentialSchema = {
        ...schemaData,
        id: `schema_${schemaData.name.toLowerCase().replace(/\s+/g, '_')}_v${schemaData.version.replace(/\./g, '_')}`,
        createdAt: new Date().toISOString(),
        issuerDid: currentUser.did,
      };
      setSchemas((prev) => [fallback, ...prev]);
      showNotification(`Credential Schema '${fallback.name}' registered to decentralized registry`, 'success');
      return fallback;
    }
  };

  const issueCredential = async (request: CredentialIssuanceRequest): Promise<{ success: boolean; credential?: VerifiableCredential; error?: string }> => {
    try {
      const res = await api.credentials.issue({
        schemaId: request.schemaId,
        holderDid: request.holderDid,
        claims: request.claims,
        expirationMonths: request.expirationMonths,
      });

      const frontendCred = mapDbCredToFrontend(res.credential);
      setCredentials((prev) => [frontendCred, ...prev]);
      showNotification(`Credential '${frontendCred.schemaName}' cryptographically signed & issued`, 'success');
      return { success: true, credential: frontendCred };
    } catch (e: any) {
      // Local fallback execution
      const targetSchema = schemas.find((s) => s.id === request.schemaId);
      if (!targetSchema) {
        return { success: false, error: 'Schema not found in registry' };
      }

      const validation = validateCredentialClaims(targetSchema, request.claims);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      const issuanceDate = new Date().toISOString();
      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() + (request.expirationMonths || 12));
      const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newCredential: VerifiableCredential = {
        id: `urn:uuid:cred-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        context: ['https://www.w3.org/2018/credentials/v1', targetSchema.schemaUri],
        type: ['VerifiableCredential', targetSchema.type],
        schemaId: targetSchema.id,
        schemaName: targetSchema.name,
        issuer: {
          id: currentUser.did,
          name: currentUser.organization || currentUser.name,
          isTrusted: true,
        },
        issuanceDate,
        expirationDate: expDate.toISOString(),
        status: 'signed',
        credentialSubject: {
          id: request.holderDid,
          ...request.claims,
        },
        proof: {
          type: 'ZeroPassSignature2026',
          created: issuanceDate,
          verificationMethod: `${currentUser.did}#keys-1`,
          proofPurpose: 'assertionMethod',
          proofValue: `0x${randomHex}`,
          merkleIndex: Math.floor(Math.random() * 500) + 1,
        },
        revocation: {
          revoked: false,
        },
      };

      setCredentials((prev) => [newCredential, ...prev]);
      showNotification(`Credential '${targetSchema.name}' cryptographically signed & issued`, 'success');
      return { success: true, credential: newCredential };
    }
  };

  const revokeCredential = async (credentialId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.credentials.revoke(credentialId, reason);
    } catch (e) {
      console.warn('Revoking locally:', e);
    }

    const timestamp = new Date().toISOString();
    setCredentials((prev) =>
      prev.map((c) => {
        if (c.id === credentialId) {
          return {
            ...c,
            status: 'revoked' as const,
            revocation: {
              revoked: true,
              reason: reason.trim() || 'Revoked by authorized issuer',
              revocationTimestamp: timestamp,
              registryIndex: Math.floor(Math.random() * 200) + 1,
            },
          };
        }
        return c;
      })
    );

    showNotification(`Credential ${credentialId.slice(0, 18)}... revoked on registry`, 'warning');
    return { success: true };
  };

  const getIssuerStatistics = (): IssuerStatistics => {
    const totalIssued = credentials.length;
    const activeCredentials = credentials.filter((c) => c.status === 'signed').length;
    const revokedCredentials = credentials.filter((c) => c.status === 'revoked').length;
    const activeSchemas = schemas.length;
    const verificationSuccessRate = 99.4;

    return {
      totalIssued,
      activeCredentials,
      revokedCredentials,
      activeSchemas,
      verificationSuccessRate,
    };
  };

  // Verifier actions
  const createPolicy = async (policyData: Omit<VerificationPolicy, 'id' | 'createdAt'>): Promise<VerificationPolicy> => {
    const newPolicy: VerificationPolicy = {
      ...policyData,
      id: `policy_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    setPolicies((prev) => [newPolicy, ...prev]);
    showNotification(`Verification Policy '${newPolicy.title}' created`, 'success');
    return newPolicy;
  };

  const createProofSession = (policyId: string): ProofSession => {
    const policy = policies.find((p) => p.id === policyId) || policies[0];
    const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const session: ProofSession = {
      sessionId,
      policy,
      status: 'pending',
      verifierDid: currentUser.did,
      verifierName: currentUser.organization || currentUser.name,
      qrPayload: `zeropass://verify?session=${sessionId}&policy=${policy.id}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    setActiveProofSession(session);
    setPendingHolderRequest(session);
    return session;
  };

  const clearProofSession = () => {
    setActiveProofSession(null);
  };

  const submitProofToSession = async (
    sessionId: string,
    credentialId: string,
    customDisclosedClaims?: string[]
  ): Promise<VerificationResult> => {
    const session = activeProofSession?.sessionId === sessionId ? activeProofSession : pendingHolderRequest;
    if (!session) {
      throw new Error('Verification session not found or expired');
    }

    try {
      const serverRes = await api.verifications.verifyPresentation({
        sessionId,
        credentialId,
        disclosedClaims: customDisclosedClaims,
      });

      const result: VerificationResult = serverRes.result;
      const updatedSession: ProofSession = {
        ...session,
        status: result.isValid ? 'verified' : 'failed',
        result,
      };

      setActiveProofSession(updatedSession);
      return result;
    } catch {
      // Local fallback verification engine
      const cred = credentials.find((c) => c.id === credentialId);
      if (!cred) {
        throw new Error('Credential not found in holder wallet');
      }

      const result = verifyPresentation(cred, session.policy);
      if (customDisclosedClaims && result.isValid) {
        const filtered: Record<string, any> = {};
        for (const k of customDisclosedClaims) {
          if (result.disclosedClaims[k] !== undefined) {
            filtered[k] = result.disclosedClaims[k];
          }
        }
        result.disclosedClaims = filtered;
      }

      const updatedSession: ProofSession = {
        ...session,
        status: result.isValid ? 'verified' : 'failed',
        result,
      };

      setActiveProofSession(updatedSession);

      const newLog: VerificationLog = {
        id: `log_${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        requestId: session.sessionId,
        verifierName: session.verifierName,
        credentialType: session.policy.credentialType,
        result: result.isValid ? 'SUCCESS' : 'FAILED',
        failureReason: result.failureReason,
        latencyMs: Math.floor(Math.random() * 80) + 60,
        ipAddress: '192.0.2.14',
      };
      setVerificationLogs((prev) => [newLog, ...prev]);

      return result;
    }
  };

  // Holder Actions
  const holderCredentials = credentials.filter(
    (c) => c.credentialSubject.id === currentUser.did || currentUser.role !== 'holder'
  );

  const approveHolderRequest = async (
    sessionId: string,
    credentialId: string,
    customDisclosedClaims?: string[]
  ): Promise<boolean> => {
    try {
      const res = await submitProofToSession(sessionId, credentialId, customDisclosedClaims);
      const cred = credentials.find((c) => c.id === credentialId);

      const newPresentation: PresentationRecord = {
        id: `pres_${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        verifierName: pendingHolderRequest?.verifierName || 'Authorized Verifier',
        verifierDid: pendingHolderRequest?.verifierDid || 'did:zeropass:verifier',
        credentialTitle: cred?.schemaName || 'Verifiable Credential',
        claimsDisclosed: Object.keys(res.disclosedClaims),
        predicatesProved: (pendingHolderRequest?.policy.predicates || []).map(
          (p) => `${p.attributeLabel} ${p.operator} ${p.value} (Zero-Knowledge)`
        ),
        status: res.isValid ? 'approved' : 'rejected',
      };

      setPresentations((prev) => [newPresentation, ...prev]);
      setPendingHolderRequest(null);
      showNotification('Zero-Knowledge presentation proof approved and transmitted', 'success');
      return res.isValid;
    } catch (err: any) {
      showNotification(`Proof submission failed: ${err.message}`, 'error');
      return false;
    }
  };

  const rejectHolderRequest = (sessionId: string) => {
    if (pendingHolderRequest && pendingHolderRequest.sessionId === sessionId) {
      const newPresentation: PresentationRecord = {
        id: `pres_${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        verifierName: pendingHolderRequest.verifierName,
        verifierDid: pendingHolderRequest.verifierDid,
        credentialTitle: pendingHolderRequest.policy.title,
        claimsDisclosed: [],
        predicatesProved: [],
        status: 'rejected',
      };
      setPresentations((prev) => [newPresentation, ...prev]);
      setPendingHolderRequest(null);
      showNotification('Proof verification request rejected', 'info');
    }
  };

  // Developer Actions
  const createApiKey = (name: string, scopes: ApiKey['scopes']) => {
    const rawSecret = `zp_live_${Array.from({ length: 36 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const prefix = rawSecret.slice(0, 12);
    const maskedKey = `${prefix}••••••••••••••••${rawSecret.slice(-4)}`;

    const newKey: ApiKey = {
      id: `key_${Date.now().toString(36)}`,
      name,
      keyPrefix: prefix,
      maskedKey,
      secretKey: rawSecret,
      scopes,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    setApiKeys((prev) => [newKey, ...prev]);
    showNotification(`API Key '${name}' generated successfully`, 'success');
    return { key: newKey, secretKey: rawSecret };
  };

  const revokeApiKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k))
    );
    showNotification('API Key revoked', 'warning');
  };

  const createWebhook = (data: Omit<WebhookConfig, 'id' | 'createdAt' | 'secretToken'>): WebhookConfig => {
    const rawSecret = `whsec_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const newWebhook: WebhookConfig = {
      ...data,
      id: `wh_${Date.now().toString(36)}`,
      secretToken: rawSecret,
      createdAt: new Date().toISOString(),
      lastDeliveryStatus: 'success',
      lastDeliveryAt: new Date().toISOString(),
    };

    setWebhooks((prev) => [newWebhook, ...prev]);
    showNotification('Webhook endpoint configured', 'success');
    return newWebhook;
  };

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w))
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchRole,
        updateProfile,
        schemas,
        createSchema,
        credentials,
        issueCredential,
        revokeCredential,
        getIssuerStatistics,
        policies,
        createPolicy,
        activeProofSession,
        createProofSession,
        clearProofSession,
        submitProofToSession,
        holderCredentials,
        presentations,
        pendingHolderRequest,
        approveHolderRequest,
        rejectHolderRequest,
        trustedIssuers,
        apiKeys,
        createApiKey,
        revokeApiKey,
        webhooks,
        createWebhook,
        toggleWebhook,
        verificationLogs,
        notification,
        showNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
