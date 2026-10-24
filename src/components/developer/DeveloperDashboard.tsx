import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiKey, WebhookConfig, VerificationLog } from '../../types/developer';
import { Modal } from '../common/Modal';
import { formatDateTime, formatHash } from '../../utils/formatters';
import { 
  Terminal, 
  Key, 
  Webhook, 
  Activity, 
  BookOpen, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Lock,
  Code
} from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const { 
    apiKeys, 
    createApiKey, 
    revokeApiKey, 
    webhooks, 
    createWebhook, 
    toggleWebhook, 
    verificationLogs 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'logs' | 'docs'>('keys');

  // Key creation state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<ApiKey['scopes']>([
    'verification:verify',
    'credentials:read',
  ]);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Webhook creation state
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookDesc, setWebhookDesc] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<WebhookConfig['events']>([
    'proof.verified',
    'proof.failed',
  ]);

  // Code sample selector
  const [selectedLang, setSelectedLang] = useState<'curl' | 'typescript' | 'python'>('typescript');

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    const { secretKey } = createApiKey(keyName, selectedScopes);
    setNewlyCreatedSecret(secretKey);
    setKeyName('');
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    createWebhook({
      url: webhookUrl.trim(),
      description: webhookDesc.trim() || 'Webhook Endpoint',
      events: webhookEvents,
      isActive: true,
    });
    setWebhookUrl('');
    setWebhookDesc('');
    setIsWebhookModalOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Identity Ecosystem</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Developer & Integration Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Developer API & Gateway
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage scoped API credentials, configure verification event webhooks, and inspect real-time request logs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            Base URL: https://api.zeropass.network/v1
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('keys')}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'keys'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Keys ({apiKeys.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('webhooks')}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'webhooks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>Webhooks ({webhooks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Verification Logs ({verificationLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'docs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>API Documentation & SDK</span>
        </button>
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">API Credentials</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authenticate server-side requests. Secret keys are displayed only once upon generation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewlyCreatedSecret(null);
                setIsKeyModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate New API Key</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Key Name</th>
                    <th className="py-3 px-4">Key Token</th>
                    <th className="py-3 px-4">Scopes</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {k.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {k.maskedKey}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono tabular-nums">
                        {formatDateTime(k.createdAt).split(',')[0]}
                      </td>
                      <td className="py-3.5 px-4">
                        {k.status === 'active' ? (
                          <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {k.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => revokeApiKey(k.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Event Webhooks</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Receive asynchronous HMAC-signed notifications when proofs are verified or credentials revoked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Webhook Endpoint</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-mono font-semibold text-slate-900 truncate max-w-xs">
                      {wh.url}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleWebhook(wh.id)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        wh.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {wh.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{wh.description}</p>

                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Subscribed Events
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map((ev) => (
                        <span
                          key={ev}
                          className="font-mono text-[11px] text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 p-2 bg-slate-50 border border-slate-100 rounded text-xs font-mono text-slate-600 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Signing Secret:</span>
                    <span>{formatHash(wh.secretToken, 8, 4)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Last delivery: {wh.lastDeliveryStatus || 'nominal'}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDateTime(wh.createdAt).split(',')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VERIFICATION LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Verification Request Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit trail of cryptographic verification queries, latency benchmarks, and error diagnostics.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Verifier Policy</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {verificationLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-600 tabular-nums">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-indigo-700">
                        {log.requestId}
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-sans font-medium">
                        {log.credentialType}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {log.result === 'SUCCESS' ? (
                          <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Success
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Failed
                          </span>
                        )}
                        {log.failureReason && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs font-mono">
                            {log.failureReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 tabular-nums">
                        {log.latencyMs}ms
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: API DOCUMENTATION & SDK */}
      {activeTab === 'docs' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-base font-bold text-slate-900">Developer Documentation & SDK Reference</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Integrate ZeroPass zero-knowledge verification into your web, mobile, or enterprise backend services.
            </p>
          </div>

          {/* Lang Selector */}
          <div className="flex items-center gap-2">
            {(['typescript', 'curl', 'python'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  selectedLang === lang
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Code Box */}
          <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-md">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">
                {selectedLang === 'typescript'
                  ? 'verify-presentation.ts'
                  : selectedLang === 'python'
                  ? 'verify_presentation.py'
                  : 'curl-verify.sh'}
              </span>
              <span className="text-slate-400">ZeroPass SDK v2.0</span>
            </div>

            <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed">
              {selectedLang === 'typescript' && (
                <pre>{`import { ZeroPassVerifier } from '@zeropass/sdk';

const verifier = new ZeroPassVerifier({
  apiKey: process.env.ZEROPASS_API_KEY, // 'zp_live_...'
  environment: 'production',
});

// 1. Create a Zero-Knowledge Verification Request Session
const session = await verifier.createSession({
  policyId: 'policy_adult_18_zk',
  callbackUrl: 'https://api.yourdomain.com/webhooks/zeropass',
  expiresInSeconds: 1800,
});

console.log('Wallet QR URI:', session.qrPayload);

// 2. Cryptographically verify presentation received from wallet
const result = await verifier.verifyPresentation({
  sessionId: session.id,
  presentationPayload: req.body.presentation,
});

if (result.isValid) {
  console.log('Proof Validated! Satisfied Predicates:', result.satisfiedPredicates);
  console.log('Selectively Disclosed Claims:', result.disclosedClaims);
} else {
  console.error('Verification Rejected:', result.failureReason);
}`}</pre>
              )}

              {selectedLang === 'curl' && (
                <pre>{`# 1. Create Verification Session
curl -X POST https://api.zeropass.network/v1/sessions \\
  -H "Authorization: Bearer zp_live_948a90124f8d..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "policyId": "policy_adult_18_zk",
    "expiresInSeconds": 1800
  }'

# 2. Verify Cryptographic Proof Presentation
curl -X POST https://api.zeropass.network/v1/verify \\
  -H "Authorization: Bearer zp_live_948a90124f8d..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "sessionId": "sess_live_init_9921",
    "proof": "0x3a829f01bc74e92a838df2...",
    "credentialId": "urn:uuid:cred-age-4401"
  }'`}</pre>
              )}

              {selectedLang === 'python' && (
                <pre>{`from zeropass import ZeroPassClient

client = ZeroPassClient(api_key="zp_live_948a90124f8d...")

# Create verification session
session = client.sessions.create(
    policy_id="policy_adult_18_zk",
    callback_url="https://api.yourdomain.com/webhooks/zeropass"
)

print(f"Present this QR URI to user: {session.qr_payload}")

# Verify presentation
result = client.verify(
    session_id=session.id,
    presentation=request.json.get("presentation")
)

if result.is_valid:
    print("User is 18+ without revealing birthdate!")
else:
    print(f"Failed: {result.failure_reason}")`}</pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: New API Key */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title={newlyCreatedSecret ? 'API Key Generated' : 'Generate New API Key'}
        subtitle="Configure secret credentials for backend service authentication"
        maxWidth="md"
      >
        {!newlyCreatedSecret ? (
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Key Identifier Name *
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production Verifier Service"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Authorized Permissions / Scopes
              </label>
              <div className="space-y-2">
                {[
                  { scope: 'verification:verify', label: 'Verify Presentations & ZK Circuits' },
                  { scope: 'credentials:read', label: 'Query Schema & Status Registries' },
                  { scope: 'credentials:issue', label: 'Issue New Verifiable Credentials' },
                  { scope: 'credentials:revoke', label: 'Revoke Issued Credentials On-Chain' },
                ].map((item) => (
                  <label key={item.scope} className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(item.scope as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScopes([...selectedScopes, item.scope as any]);
                        } else {
                          setSelectedScopes(selectedScopes.filter((s) => s !== item.scope));
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Create API Key
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Please copy this secret key now. For your security, it will never be displayed again.
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg text-slate-100 flex items-center justify-between font-mono text-xs">
              <span className="truncate mr-2 select-all">{newlyCreatedSecret}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(newlyCreatedSecret)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors shrink-0"
                title="Copy API key"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setNewlyCreatedSecret(null);
                  setIsKeyModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: New Webhook */}
      <Modal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        title="Register Webhook Endpoint"
        subtitle="Subscribe to asynchronous cryptographic verification events"
        maxWidth="md"
      >
        <form onSubmit={handleCreateWebhook} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination URL *
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/webhooks/zeropass"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={webhookDesc}
              onChange={(e) => setWebhookDesc(e.target.value)}
              placeholder="e.g. Audit Service Proof Pipeline"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Trigger Events
            </label>
            <div className="space-y-1.5">
              {[
                'proof.verified',
                'proof.failed',
                'credential.issued',
                'credential.revoked',
              ].map((ev) => (
                <label key={ev} className="flex items-center gap-2 text-xs text-slate-700 font-mono">
                  <input
                    type="checkbox"
                    checked={webhookEvents.includes(ev as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWebhookEvents([...webhookEvents, ev as any]);
                      } else {
                        setWebhookEvents(webhookEvents.filter((item) => item !== ev));
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span>{ev}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsWebhookModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Add Endpoint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
