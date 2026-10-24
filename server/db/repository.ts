import * as fs from 'node:fs';
import * as path from 'node:path';
import { 
  DbUser, 
  DbIssuer, 
  DbCredentialSchema, 
  DbCredential, 
  DbVerificationPolicy, 
  DbVerificationSession, 
  DbPresentationRecord, 
  DbApiKey, 
  DbWebhook, 
  DbVerificationLog 
} from './types';
import { createInitialSeedData } from './seed';

interface DatabaseData {
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
}

export class Repository {
  private dataDir: string;
  private dataFile: string;
  private data: DatabaseData | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'server/data');
    this.dataFile = path.join(this.dataDir, 'zeropass.json');
  }

  public async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataFile)) {
        try {
          const raw = fs.readFileSync(this.dataFile, 'utf-8');
          this.data = JSON.parse(raw);
          return;
        } catch (e) {
          console.warn('Corrupted database file, re-initializing from seed data:', e);
        }
      }

      // Initialize with seed data
      this.data = await createInitialSeedData();
      this.persist();
    })();

    return this.initPromise;
  }

  private persist() {
    if (!this.data) return;
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    }
  }

  // Users
  public async findUserByEmail(email: string): Promise<DbUser | null> {
    await this.init();
    return this.data!.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public async findUserByDid(did: string): Promise<DbUser | null> {
    await this.init();
    return this.data!.users.find((u) => u.did === did) || null;
  }

  public async findUserById(id: string): Promise<DbUser | null> {
    await this.init();
    return this.data!.users.find((u) => u.id === id) || null;
  }

  public async createUser(user: DbUser): Promise<DbUser> {
    await this.init();
    this.data!.users.push(user);
    this.persist();
    return user;
  }

  public async updateUser(id: string, updates: Partial<DbUser>): Promise<DbUser | null> {
    await this.init();
    const idx = this.data!.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data!.users[idx] = { ...this.data!.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data!.users[idx];
  }

  // Issuers
  public async getIssuers(): Promise<DbIssuer[]> {
    await this.init();
    return [...this.data!.issuers];
  }

  public async findIssuerByDid(did: string): Promise<DbIssuer | null> {
    await this.init();
    return this.data!.issuers.find((i) => i.did === did) || null;
  }

  public async createIssuer(issuer: DbIssuer): Promise<DbIssuer> {
    await this.init();
    this.data!.issuers.push(issuer);
    this.persist();
    return issuer;
  }

  // Schemas
  public async getSchemas(): Promise<DbCredentialSchema[]> {
    await this.init();
    return [...this.data!.schemas];
  }

  public async findSchemaById(id: string): Promise<DbCredentialSchema | null> {
    await this.init();
    return this.data!.schemas.find((s) => s.id === id) || null;
  }

  public async findSchemaByType(type: string): Promise<DbCredentialSchema | null> {
    await this.init();
    return this.data!.schemas.find((s) => s.type === type) || null;
  }

  public async createSchema(schema: DbCredentialSchema): Promise<DbCredentialSchema> {
    await this.init();
    this.data!.schemas.unshift(schema);
    this.persist();
    return schema;
  }

  // Credentials
  public async getCredentials(filter?: { holderDid?: string; issuerDid?: string }): Promise<DbCredential[]> {
    await this.init();
    let creds = [...this.data!.credentials];
    if (filter?.holderDid) {
      creds = creds.filter((c) => c.holderDid === filter.holderDid);
    }
    if (filter?.issuerDid) {
      creds = creds.filter((c) => c.issuerDid === filter.issuerDid);
    }
    return creds;
  }

  public async findCredentialById(id: string): Promise<DbCredential | null> {
    await this.init();
    return this.data!.credentials.find((c) => c.id === id) || null;
  }

  public async createCredential(credential: DbCredential): Promise<DbCredential> {
    await this.init();
    this.data!.credentials.unshift(credential);
    // increment issuer counter
    const issuer = this.data!.issuers.find((i) => i.did === credential.issuerDid);
    if (issuer) {
      issuer.activeCredentialsIssued += 1;
    }
    this.persist();
    return credential;
  }

  public async revokeCredential(id: string, reason: string): Promise<DbCredential | null> {
    await this.init();
    const cred = this.data!.credentials.find((c) => c.id === id);
    if (!cred) return null;
    cred.status = 'REVOKED';
    cred.revoked = true;
    cred.revokedAt = new Date().toISOString();
    cred.revocationReason = reason;
    cred.updatedAt = new Date().toISOString();
    this.persist();
    return cred;
  }

  // Verification Policies
  public async getPolicies(): Promise<DbVerificationPolicy[]> {
    await this.init();
    return [...this.data!.policies];
  }

  public async findPolicyById(id: string): Promise<DbVerificationPolicy | null> {
    await this.init();
    return this.data!.policies.find((p) => p.id === id) || null;
  }

  public async createPolicy(policy: DbVerificationPolicy): Promise<DbVerificationPolicy> {
    await this.init();
    this.data!.policies.unshift(policy);
    this.persist();
    return policy;
  }

  // Verification Sessions
  public async findSessionById(id: string): Promise<DbVerificationSession | null> {
    await this.init();
    return this.data!.sessions.find((s) => s.id === id) || null;
  }

  public async createSession(session: DbVerificationSession): Promise<DbVerificationSession> {
    await this.init();
    this.data!.sessions.unshift(session);
    this.persist();
    return session;
  }

  public async updateSession(id: string, updates: Partial<DbVerificationSession>): Promise<DbVerificationSession | null> {
    await this.init();
    const idx = this.data!.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.data!.sessions[idx] = { ...this.data!.sessions[idx], ...updates };
    this.persist();
    return this.data!.sessions[idx];
  }

  // Presentations
  public async getPresentations(holderDid?: string): Promise<DbPresentationRecord[]> {
    await this.init();
    if (holderDid) {
      return this.data!.presentations.filter((p) => p.holderDid === holderDid);
    }
    return [...this.data!.presentations];
  }

  public async createPresentation(record: DbPresentationRecord): Promise<DbPresentationRecord> {
    await this.init();
    this.data!.presentations.unshift(record);
    this.persist();
    return record;
  }

  // Developer API Keys
  public async getApiKeys(): Promise<DbApiKey[]> {
    await this.init();
    return [...this.data!.apiKeys];
  }

  public async createApiKey(key: DbApiKey): Promise<DbApiKey> {
    await this.init();
    this.data!.apiKeys.unshift(key);
    this.persist();
    return key;
  }

  public async revokeApiKey(id: string): Promise<boolean> {
    await this.init();
    const key = this.data!.apiKeys.find((k) => k.id === id);
    if (!key) return false;
    key.status = 'REVOKED';
    this.persist();
    return true;
  }

  // Webhooks
  public async getWebhooks(): Promise<DbWebhook[]> {
    await this.init();
    return [...this.data!.webhooks];
  }

  public async createWebhook(webhook: DbWebhook): Promise<DbWebhook> {
    await this.init();
    this.data!.webhooks.unshift(webhook);
    this.persist();
    return webhook;
  }

  public async updateWebhook(id: string, updates: Partial<DbWebhook>): Promise<DbWebhook | null> {
    await this.init();
    const idx = this.data!.webhooks.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    this.data!.webhooks[idx] = { ...this.data!.webhooks[idx], ...updates };
    this.persist();
    return this.data!.webhooks[idx];
  }

  // Logs
  public async getLogs(): Promise<DbVerificationLog[]> {
    await this.init();
    return [...this.data!.logs];
  }

  public async addLog(log: DbVerificationLog): Promise<DbVerificationLog> {
    await this.init();
    this.data!.logs.unshift(log);
    // Keep last 100 logs
    if (this.data!.logs.length > 100) {
      this.data!.logs = this.data!.logs.slice(0, 100);
    }
    this.persist();
    return log;
  }
}

export const db = new Repository();
