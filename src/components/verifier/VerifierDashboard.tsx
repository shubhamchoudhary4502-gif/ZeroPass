import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationPolicy, ProofSession } from '../../types/proof';
import { CreatePolicyModal } from './CreatePolicyModal';
import { VerificationSessionView } from './VerificationSessionView';
import { 
  ShieldCheck, 
  Plus, 
  QrCode, 
  Lock, 
  EyeOff, 
  Layers, 
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const VerifierDashboard: React.FC = () => {
  const { policies, activeProofSession, createProofSession, clearProofSession, currentUser } = useApp();
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const handleLaunchSession = (policyId: string) => {
    createProofSession(policyId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Identity Ecosystem</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Verifier Gateway Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Verifier Policy Gateway
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define mathematical zero-knowledge verification rules, generate QR proof sessions, and authenticate credentials without storing user data.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsPolicyModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Verification Policy</span>
        </button>
      </div>

      {/* Active Verification Session Panel (if one is generated) */}
      {activeProofSession && (
        <VerificationSessionView
          session={activeProofSession}
          onClose={clearProofSession}
        />
      )}

      {/* Policies Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Verification Policies</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any policy below to generate an active proof session and QR code for mobile wallets.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {policy.credentialType}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {policy.id}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1.5">{policy.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {policy.description}
                </p>

                {/* ZK Predicates Pill-free list */}
                <div className="space-y-2 mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Zero-Knowledge Conditions ({policy.predicates.length})</span>
                  </div>
                  {policy.predicates.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">None (Presence check only)</span>
                  ) : (
                    <div className="space-y-1">
                      {policy.predicates.map((p, idx) => (
                        <div key={idx} className="text-xs font-mono text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100 flex items-center justify-between">
                          <span>{p.attributeLabel}</span>
                          <span className="font-bold text-indigo-600">{p.operator.toUpperCase()} {String(p.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plaintext Disclosed Claims */}
                <div className="space-y-1 text-xs text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Plaintext Claims Required
                  </span>
                  <span className="text-slate-700 font-mono">
                    {policy.disclosedClaims.length > 0
                      ? policy.disclosedClaims.map((c) => c.attributeLabel).join(', ')
                      : 'Zero-Knowledge Only (0 attributes)'}
                  </span>
                </div>
              </div>

              {/* Action Button: Generate Session */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Created {formatDateTime(policy.createdAt).split(',')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => handleLaunchSession(policy.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Generate QR Request</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verifier Architecture Card */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Zero-Knowledge Proof Verification Guarantee</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
          ZeroPass verifications use zero-knowledge SNARK circuits. The verifier verifies that the holder possesses a valid signature from a trusted issuer and that the secret claims satisfy the predicate (e.g. <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">age &gt;= 18</code>) without the holder having to reveal their exact birthdate or sensitive identification numbers.
        </p>
      </div>

      {/* Modal */}
      <CreatePolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />
    </div>
  );
};
