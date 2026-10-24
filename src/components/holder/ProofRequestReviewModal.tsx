import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { ProofSession } from '../../types/proof';
import { VerifiableCredential } from '../../types/credential';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  EyeOff, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Lock, 
  Building2,
  ChevronRight,
  Eye
} from 'lucide-react';
import { formatDid } from '../../utils/formatters';

interface ProofRequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ProofSession | null;
}

export const ProofRequestReviewModal: React.FC<ProofRequestReviewModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const { credentials, approveHolderRequest, rejectHolderRequest } = useApp();
  const [selectedCredentialId, setSelectedCredentialId] = useState<string>('');
  const [selectedDisclosedClaims, setSelectedDisclosedClaims] = useState<string[]>([]);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState('');

  // Find matching credentials that satisfy the policy credential type
  const matchingCredentials = session
    ? credentials.filter(
        (c) =>
          c.type.includes(session.policy.credentialType) ||
          c.schemaId === session.policy.schemaId
      )
    : [];

  // Initialize selected credential & claims if not set
  React.useEffect(() => {
    if (matchingCredentials.length > 0 && !selectedCredentialId) {
      const best = matchingCredentials.find((c) => c.status === 'signed') || matchingCredentials[0];
      setSelectedCredentialId(best.id);
    }
  }, [matchingCredentials, selectedCredentialId]);

  React.useEffect(() => {
    if (session) {
      // Default select all required and optional requested claims
      const defaults = session.policy.disclosedClaims.map((c) => c.attributeKey);
      setSelectedDisclosedClaims(defaults);
    }
  }, [session]);

  if (!session) return null;

  const toggleClaim = (key: string, required: boolean) => {
    if (required) return; // Cannot uncheck required claims
    setSelectedDisclosedClaims((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleApprove = async () => {
    if (!selectedCredentialId) {
      setError('Please select a compatible credential to prove');
      return;
    }

    setIsGeneratingProof(true);
    setError('');

    try {
      const success = await approveHolderRequest(
        session.sessionId,
        selectedCredentialId,
        selectedDisclosedClaims
      );
      if (success) {
        onClose();
      } else {
        setError('Verification rejected: the selected credential claims do not satisfy the verifier policy.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate zero-knowledge proof');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleReject = () => {
    rejectHolderRequest(session.sessionId);
    onClose();
  };

  const activeCred = credentials.find((c) => c.id === selectedCredentialId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Zero-Knowledge Proof Request"
      subtitle="A relying party is requesting cryptographic verification of your credentials"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Verifier Identity Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{session.verifierName}</h4>
                <span className="text-[11px] text-emerald-700 font-medium">· Verified Requester</span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                DID: {formatDid(session.verifierDid, 10)}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                <strong>Policy Purpose:</strong> {session.policy.description}
              </p>
            </div>
          </div>
        </div>

        {/* Select Matching Credential */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Select Credential From Your Wallet
          </label>
          {matchingCredentials.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              No credential in your wallet satisfies the requested type (
              <span className="font-mono">{session.policy.credentialType}</span>).
            </div>
          ) : (
            <div className="space-y-2">
              {matchingCredentials.map((cred) => (
                <label
                  key={cred.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCredentialId === cred.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="selectedCredential"
                      checked={selectedCredentialId === cred.id}
                      onChange={() => setSelectedCredentialId(cred.id)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{cred.schemaName}</p>
                      <p className="text-[11px] text-slate-500">
                        Issued by {cred.issuer.name} · Status: <span className="capitalize">{cred.status}</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 truncate max-w-[120px]">
                    {cred.id.slice(0, 14)}...
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Zero-Knowledge Predicates Section (Proved mathematically without disclosing raw values) */}
        {session.policy.predicates.length > 0 && (
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-xs">
              <EyeOff className="w-4 h-4 text-indigo-600" />
              <span>Zero-Knowledge Mathematical Proofs (No Raw Data Shared)</span>
            </div>
            <p className="text-[11px] text-indigo-700">
              The verifier will mathematically check these assertions using SNARK circuits without seeing your personal data:
            </p>

            <div className="space-y-1.5 pt-1">
              {session.policy.predicates.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-indigo-200/60 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-medium text-slate-800">
                      Condition: {p.attributeLabel} {p.operator.toUpperCase()} {String(p.value)}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    ZK Circuit Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selective Disclosure of Claims (User has control over what to share) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Selectively Disclosed Claims ({session.policy.disclosedClaims.length})
            </label>
            <span className="text-[11px] text-slate-400">
              Only checked claims will be shared
            </span>
          </div>

          <div className="space-y-2">
            {session.policy.disclosedClaims.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                No direct claims requested. This presentation is 100% Zero-Knowledge.
              </p>
            ) : (
              session.policy.disclosedClaims.map((claim) => {
                const isSelected = selectedDisclosedClaims.includes(claim.attributeKey);
                const rawVal = activeCred?.credentialSubject[claim.attributeKey];

                return (
                  <div
                    key={claim.attributeKey}
                    onClick={() => toggleClaim(claim.attributeKey, claim.required)}
                    className={`p-3 rounded-lg border transition-colors flex items-center justify-between ${
                      claim.required
                        ? 'bg-slate-50/70 border-slate-200 cursor-not-allowed'
                        : isSelected
                        ? 'bg-white border-indigo-300 cursor-pointer shadow-2xs'
                        : 'bg-white border-slate-200 cursor-pointer opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={claim.required}
                        onChange={() => toggleClaim(claim.attributeKey, claim.required)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            {claim.attributeLabel}
                          </span>
                          {claim.required ? (
                            <span className="text-[10px] text-slate-400 font-medium">
                              (Required by policy)
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-600 font-medium">
                              (Optional - Discloseable)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Value: {rawVal !== undefined ? String(rawVal) : 'Not in credential'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-500">
                        {isSelected ? 'Will Disclose' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            Reject Request
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGeneratingProof || matchingCredentials.length === 0}
              onClick={handleApprove}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isGeneratingProof ? 'Generating ZK Proof...' : 'Generate ZK Proof & Approve'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
