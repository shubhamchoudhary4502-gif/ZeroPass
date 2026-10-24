import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerifiableCredential } from '../../types/credential';
import { StatusBadge } from '../common/StatusBadge';
import { CreateSchemaModal } from './CreateSchemaModal';
import { IssueCredentialModal } from './IssueCredentialModal';
import { RevokeCredentialModal } from './RevokeCredentialModal';
import { formatDid, formatDate, formatHash } from '../../utils/formatters';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Search, 
  ExternalLink,
  Layers,
  Key,
  CheckCircle,
  Clock
} from 'lucide-react';

export const IssuerDashboard: React.FC = () => {
  const { schemas, credentials, currentUser, getIssuerStatistics } = useApp();
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [revokeTargetCred, setRevokeTargetCred] = useState<VerifiableCredential | null>(null);
  const [preselectedSchemaId, setPreselectedSchemaId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'signed' | 'draft' | 'revoked'>('all');

  const stats = getIssuerStatistics();

  // Filter credentials
  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.schemaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.credentialSubject.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cred.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Identity Ecosystem</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Issuer Authority Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Issuer Authority Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define cryptographic schemas, issue zero-knowledge credentials, and manage on-chain status registries.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSchemaModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Create Schema</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPreselectedSchemaId(undefined);
              setIsIssueModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Credential</span>
          </button>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Credentials</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {stats.totalIssued}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lifetime records</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-emerald-700 font-medium">Active & Signed</span>
          <p className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {stats.activeCredentials}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Cryptographically valid</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-rose-700 font-medium">Revoked Status</span>
          <p className="text-2xl font-bold text-rose-700 font-mono tabular-nums mt-1">
            {stats.revokedCredentials}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Revocation registry</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="text-xs text-indigo-700 font-medium">Registered Schemas</span>
          <p className="text-2xl font-bold text-indigo-900 font-mono tabular-nums mt-1">
            {stats.activeSchemas}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">JSON-LD W3C standard</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs col-span-2 md:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Verification Rate</span>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {stats.verificationSuccessRate}%
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Sub-second proofs</span>
        </div>
      </div>

      {/* Issuer Profile & Trust Verification Status */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {currentUser.organization || currentUser.name}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Accredited Trust Anchor
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>DID: <strong className="font-mono text-slate-700">{formatDid(currentUser.did, 10)}</strong></span>
                <span>·</span>
                <span>Verification Method: <strong className="text-slate-700">Ed25519 & BLS12-381 Curves</strong></span>
                <span>·</span>
                <span>Registry: <strong className="text-slate-700">Polygon ID / ZeroPass Testnet</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto text-xs text-slate-500">
            <span className="font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
              Fingerprint: 0x9924...b819
            </span>
          </div>
        </div>
      </div>

      {/* Registered Schemas Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Credential Schemas ({schemas.length})
            </h2>
            <p className="text-xs text-slate-500">
              Schemas define claim definitions, cryptographic constraints, and field validation rules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {schemas.map((schema) => (
            <div
              key={schema.id}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">v{schema.version}</span>
                  <span className="text-[11px] text-indigo-700 font-medium">
                    {schema.attributes.length} attributes
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">{schema.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{schema.description}</p>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <span className="block truncate font-mono">{schema.type}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setPreselectedSchemaId(schema.id);
                    setIsIssueModalOpen(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Issue from schema →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issued Credentials Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Issued Credential Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable records of all issued and drafted credentials. Notice the explicit distinction between signed credentials and unsigned drafts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search credential or DID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
              />
            </div>

            {/* Status Filter Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
              {(['all', 'signed', 'draft', 'revoked'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 font-medium rounded-md transition-colors capitalize ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High Density Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Credential & Schema</th>
                <th className="py-3 px-4">Holder DID (Subject)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Issuance Date</th>
                <th className="py-3 px-4">Signature Proof</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCredentials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No credential records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredCredentials.map((cred) => (
                  <tr key={cred.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{cred.schemaName}</span>
                      <span className="text-[11px] text-slate-400 font-mono truncate block max-w-xs">
                        {cred.id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {formatDid(cred.credentialSubject.id, 8)}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={cred.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">
                      {formatDate(cred.issuanceDate)}
                    </td>

                    <td className="py-3.5 px-4">
                      {cred.proof ? (
                        <div className="text-[11px]">
                          <span className="font-mono text-slate-700 block">
                            {formatHash(cred.proof.proofValue, 6, 4)}
                          </span>
                          <span className="text-slate-400">
                            Index #{cred.proof.merkleIndex ?? 1}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 italic">
                          Unsigned draft
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {cred.status === 'signed' ? (
                        <button
                          type="button"
                          onClick={() => setRevokeTargetCred(cred)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                        >
                          Revoke
                        </button>
                      ) : cred.status === 'revoked' ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Revoked
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPreselectedSchemaId(cred.schemaId);
                            setIsIssueModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                        >
                          Sign Draft
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <IssueCredentialModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        preselectedSchemaId={preselectedSchemaId}
      />

      <RevokeCredentialModal
        isOpen={!!revokeTargetCred}
        onClose={() => setRevokeTargetCred(null)}
        credential={revokeTargetCred}
      />
    </div>
  );
};
