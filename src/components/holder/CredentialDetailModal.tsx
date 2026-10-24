import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { VerifiableCredential } from '../../types/credential';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime, formatDid } from '../../utils/formatters';
import { ShieldCheck, Copy, Check, Code, FileText, CheckCircle2, Lock } from 'lucide-react';

interface CredentialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: VerifiableCredential | null;
}

export const CredentialDetailModal: React.FC<CredentialDetailModalProps> = ({
  isOpen,
  onClose,
  credential,
}) => {
  const [viewJson, setViewJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!credential) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(credential, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={credential.schemaName}
      subtitle={`W3C Verifiable Credential • Issued by ${credential.issuer.name}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Status & Issuer Banner */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={credential.status} />
              {credential.issuer.isTrusted && (
                <span className="text-[11px] text-emerald-700 font-medium">
                  · Verified Trust Anchor
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Issuer DID: {formatDid(credential.issuer.id, 10)}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs">
            <span className="text-slate-400 block text-[11px]">Validity Interval</span>
            <span className="font-mono text-slate-700 tabular-nums">
              {formatDate(credential.issuanceDate)} → {formatDate(credential.expirationDate)}
            </span>
          </div>
        </div>

        {/* Tab Toggle: Human Claims vs W3C JSON-LD */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewJson(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                !viewJson
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Attested Claims
            </button>
            <button
              type="button"
              onClick={() => setViewJson(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 ${
                viewJson
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>W3C JSON-LD Document</span>
            </button>
          </div>

          {viewJson && (
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        {!viewJson ? (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Subject Claims (Held Locally in Wallet)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(credential.credentialSubject).map(([key, val]) => (
                <div key={key} className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="text-xs font-medium text-slate-900 font-mono break-all">
                    {typeof val === 'boolean' ? (val ? 'True (Verified)' : 'False') : String(val)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cryptographic Proof Details */}
            {credential.proof && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-900 font-semibold mb-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cryptographic Proof Envelope</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Algorithm / Suite:</span>
                    <span className="font-mono text-slate-800">{credential.proof.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Verification Method:</span>
                    <span className="font-mono text-slate-800 truncate block">
                      {credential.proof.verificationMethod}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Signature Proof Value:</span>
                    <span className="font-mono text-slate-800 break-all text-[11px] bg-white p-1.5 rounded border border-slate-200 block">
                      {credential.proof.proofValue}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Revocation notice if revoked */}
            {credential.revocation?.revoked && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                <p className="font-semibold">Revocation Notice</p>
                <p>{credential.revocation.reason}</p>
                <p className="text-[11px] text-rose-600 font-mono">
                  Timestamp: {formatDateTime(credential.revocation.revocationTimestamp || '')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto max-h-96">
            <pre>{JSON.stringify(credential, null, 2)}</pre>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Stored in secure local cryptographic vault</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
