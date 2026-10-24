export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  secretKey?: string; // only returned once upon generation
  scopes: ('credentials:read' | 'credentials:issue' | 'credentials:revoke' | 'verification:verify' | 'schemas:write')[];
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
}

export interface WebhookConfig {
  id: string;
  url: string;
  description: string;
  events: ('credential.issued' | 'credential.revoked' | 'proof.verified' | 'proof.failed')[];
  secretToken: string;
  isActive: boolean;
  createdAt: string;
  lastDeliveryStatus?: 'success' | 'failure';
  lastDeliveryAt?: string;
}

export interface VerificationLog {
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
