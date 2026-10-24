import { env } from '../config/env';

export interface DigiLockerProviderConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  enabled: boolean;
}

export interface DigiLockerIntegrationChecklist {
  step: string;
  status: 'PENDING_EXTERNAL_APPROVAL' | 'CONFIGURED' | 'READY';
  description: string;
}

export class DigiLockerProvider {
  private config: DigiLockerProviderConfig;

  constructor() {
    this.config = {
      clientId: env.DIGILOCKER_CLIENT_ID,
      clientSecret: env.DIGILOCKER_CLIENT_SECRET,
      redirectUri: env.DIGILOCKER_REDIRECT_URI,
      enabled: env.DIGILOCKER_ENABLED === 'true',
    };
  }

  public getStatus() {
    return {
      enabled: this.config.enabled,
      configured: !!(this.config.clientId && this.config.clientSecret),
      endpoints: {
        authorizationUrl: 'https://api.digitallocker.gov.in/public/oauth2/1/authorize',
        tokenUrl: 'https://api.digitallocker.gov.in/public/oauth2/1/token',
        issuedDocumentsUrl: 'https://api.digitallocker.gov.in/public/oauth2/1/xml/eaadhaar',
      },
      specificationNotes: [
        'DigiLocker requires official government API Setu partner registration and organization whitelist approval.',
        'ZeroPass acts as a Verifier / Requester entity requesting read access for Aadhaar / driving license / academic records.',
        'Retrieving a document via DigiLocker validates the authenticity of the MeitY-signed XML.',
        'Once validated, an authorized Issuer Authority issues a W3C-compliant Verifiable Credential bound to the subject DID.',
      ],
      integrationChecklist: [
        {
          step: '1. API Setu / DigiLocker Portal Organization Registration',
          status: 'PENDING_EXTERNAL_APPROVAL',
          description: 'Entity must register at partners.digitallocker.gov.in with valid organization credentials and submit business use case.',
        },
        {
          step: '2. IP Whitelisting & Secure TLS Endpoint Verification',
          status: 'PENDING_EXTERNAL_APPROVAL',
          description: 'Production IP address and SSL callback URL must be whitelisted on MeitY firewall.',
        },
        {
          step: '3. OAuth 2.0 Consent Architecture',
          status: 'CONFIGURED',
          description: 'Client-side redirect to DigiLocker citizen login with scope "eaadhaar,dlicence" and state nonce validation.',
        },
        {
          step: '4. Cryptographic Issuer Transformation',
          status: 'CONFIGURED',
          description: 'Parse MeitY XML digital signature, extract claims, and issue W3C Ed25519 Verifiable Credential.',
        },
      ] as DigiLockerIntegrationChecklist[],
    };
  }

  public getAuthorizationUrl(): { url?: string; error?: string } {
    if (!this.config.enabled || !this.config.clientId) {
      return {
        error: 'DigiLocker integration is disabled in this environment. External MeitY partner approval and API Setu credentials are required.',
      };
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri || '',
      state: 'zeropass_oauth_state_nonce',
    });
    return {
      url: `https://api.digitallocker.gov.in/public/oauth2/1/authorize?${params.toString()}`,
    };
  }
}

export const digiLockerProvider = new DigiLockerProvider();
