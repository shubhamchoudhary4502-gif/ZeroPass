import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDid } from '../../utils/formatters';
import { 
  User, 
  Building2, 
  Key, 
  Shield, 
  Laptop, 
  Smartphone, 
  LogOut, 
  Copy, 
  Check, 
  AlertCircle,
  Save,
  Lock
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, updateProfile, switchRole } = useApp();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [organization, setOrganization] = useState(currentUser.organization || '');
  const [copiedDid, setCopiedDid] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');

  const [sessions, setSessions] = useState([
    { id: 'sess_1', device: 'Chrome on macOS (Current)', ip: '192.0.2.14', location: 'San Francisco, US', active: true },
    { id: 'sess_2', device: 'ZeroPass Mobile App on iOS', ip: '198.51.100.22', location: 'San Francisco, US', active: false },
  ]);

  const handleCopyDid = () => {
    navigator.clipboard.writeText(currentUser.did);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      organization: organization.trim() || undefined,
    });
  };

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Account & Decentralized Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your sovereign decentralized identifier, organization configuration, and cryptographic sessions.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2.5 border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Identity & Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2.5 border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cryptographic Keys & Trust
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sessions')}
          className={`py-2.5 border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Sessions ({sessions.length})
        </button>
      </div>

      {/* Tab 1: Profile & Organization */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Decentralized Identifier (DID)
            </h2>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Sovereign DID URI
                </span>
                <span className="font-mono text-xs text-slate-900 select-all font-medium">
                  {currentUser.did}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyDid}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                title="Copy DID"
              >
                {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Profile Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name / Legal Representative *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              {(currentUser.role === 'issuer' || currentUser.role === 'verifier') && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization / Institution Name
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Helios Polytechnic Institute"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Keys */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Cryptographic Key Management
            </h2>
            <p className="text-xs text-slate-500">
              ZeroPass operates in non-custodial fashion. Private keys never leave your secure enclave or client environment.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Signing Key Scheme:</span>
                <span className="font-mono text-slate-600">Ed25519 & BLS12-381 (W3C Standard)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Public Key Fingerprint:</span>
                <span className="font-mono text-slate-600">0x992478a012bc4f8...b819</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">ZK Prover Circuit:</span>
                <span className="font-mono text-slate-600">Groth16 BN254 Arithmetic Matrix</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('Backup phrase exported in encrypted JSON keystore.')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Export Encrypted Keystore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Authorized Sessions
            </h2>

            <div className="divide-y divide-slate-100">
              {sessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{sess.device}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {sess.ip} · {sess.location} {sess.active && '· (Current)'}
                      </p>
                    </div>
                  </div>

                  {!sess.active && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(sess.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
