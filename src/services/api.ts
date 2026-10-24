/**
 * ZeroPass Frontend API Client
 * Interfaces directly with the server-side REST API endpoints
 */

const API_BASE = '/api';

function getAuthToken(): string | null {
  return localStorage.getItem('zp_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('zp_token', token);
  } else {
    localStorage.removeItem('zp_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: any) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    getMe: () => request<{ user: any }>('/auth/me'),
    switchPersona: (role: string) =>
      request<{ token: string; user: any }>('/auth/switch-persona', {
        method: 'POST',
        body: JSON.stringify({ role: role.toUpperCase() }),
      }),
  },

  // Issuers
  issuers: {
    getAll: () => request<{ issuers: any[] }>('/issuers'),
    getByDid: (did: string) => request<{ issuer: any }>(`/issuers/${encodeURIComponent(did)}`),
  },

  // Schemas
  schemas: {
    getAll: () => request<{ schemas: any[] }>('/schemas'),
    getById: (id: string) => request<{ schema: any }>(`/schemas/${id}`),
    create: (data: any) =>
      request<{ schema: any }>('/schemas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Credentials
  credentials: {
    getAll: () => request<{ credentials: any[] }>('/credentials'),
    getById: (id: string) => request<{ credential: any }>(`/credentials/${id}`),
    issue: (data: { schemaId: string; holderDid: string; claims: any; expirationMonths?: number; saveAsDraft?: boolean }) =>
      request<{ credential: any; message: string }>('/credentials', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    revoke: (id: string, reason: string) =>
      request<{ credential: any; newAccumulatorStateRoot: string }>(`/credentials/${id}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Verifications & Presentations
  verifications: {
    createSession: (policyId: string) =>
      request<{ session: any }>('/verification-requests', {
        method: 'POST',
        body: JSON.stringify({ policyId }),
      }),
    getSession: (id: string) => request<{ session: any }>(`/verification-requests/${id}`),
    createPresentation: (data: { sessionId: string; credentialId: string; disclosedClaims?: string[] }) =>
      request<{ presentationToken: string; presentationRecord: any }>('/presentations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyPresentation: (data: { sessionId: string; credentialId?: string; presentationToken?: string; disclosedClaims?: string[] }) =>
      request<{ result: any }>('/verifications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Developer Console
  developer: {
    getKeys: () => request<{ keys: any[] }>('/developer/keys'),
    createKey: (data: { name: string; scopes: string[] }) =>
      request<{ key: any; secretKey: string }>('/developer/keys', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    revokeKey: (id: string) =>
      request<{ message: string }>(`/developer/keys/${id}`, {
        method: 'DELETE',
      }),
    getWebhooks: () => request<{ webhooks: any[] }>('/developer/webhooks'),
    createWebhook: (data: any) =>
      request<{ webhook: any }>('/developer/webhooks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getLogs: () => request<{ logs: any[] }>('/developer/logs'),
  },

  // Integrations & Health
  health: {
    check: () => request<any>('/health'),
  },
  providers: {
    getDigiLockerStatus: () => request<any>('/providers/digilocker/status'),
    getBlockchainStatus: () => request<any>('/blockchain/status'),
  },
};
