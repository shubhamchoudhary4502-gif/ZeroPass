import React from 'react';
import { VerificationResult, VerificationFailureReason } from '../../types/proof';
import { formatDateTime, formatDid } from '../../utils/formatters';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Lock, 
  Check, 
  X,
  FileCheck2,
  Database
} from 'lucide-react';

interface VerificationResultCardProps {
  result: VerificationResult;
}

export const VerificationResultCard: React.FC<VerificationResultCardProps> = ({ result }) => {
  const getFailureHeader = (reason?: VerificationFailureReason) => {
    switch (reason) {
      case 'CREDENTIAL_REVOKED':
        return {
          title: 'Verification Failed: Credential Revoked on Registry',
          desc: 'The cryptographic accumulator non-revocation check failed. This credential has been officially revoked by its issuing authority.',
          icon: AlertTriangle,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'CREDENTIAL_EXPIRED':
        return {
          title: 'Verification Failed: Credential Expired',
          desc: 'The credential validity window has lapsed according to current timestamp consensus.',
          icon: Clock,
          color: 'text-amber-800 bg-amber-50 border-amber-200',
        };
      case 'UNTRUSTED_ISSUER':
        return {
          title: 'Verification Failed: Untrusted Issuer Authority',
          desc: 'The credential was signed by an issuer DID that is not recognized in the trusted root anchor registry for this policy.',
          icon: ShieldAlert,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'PREDICATE_UNSATISFIED':
        return {
          title: 'Verification Failed: Zero-Knowledge Predicate Not Satisfied',
          desc: 'The mathematical polynomial constraint circuit evaluated to false. The subject claims do not meet policy conditions.',
          icon: XCircle,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'INVALID_SIGNATURE':
      default:
        return {
          title: 'Verification Failed: Invalid Cryptographic Signature',
          desc: 'Digital signature verification failed. The credential may be an unsigned draft, corrupted, or forged.',
          icon: XCircle,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
        };
    }
  };

  const failureMeta = getFailureHeader(result.failureReason);
  const FailureIcon = failureMeta.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-6 p-6">
      {/* Top Banner: Valid vs Failed */}
      {result.isValid ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-emerald-900">
              Cryptographic Proof Validated Successfully
            </h3>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              All multi-step zero-knowledge checks, issuer signature validation, and on-chain non-revocation verifications passed.
            </p>
          </div>
        </div>
      ) : (
        <div className={`p-4 border rounded-xl flex items-start gap-3 ${failureMeta.color}`}>
          <FailureIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold">{failureMeta.title}</h3>
            <p className="text-xs mt-0.5 leading-relaxed">{failureMeta.desc}</p>
            {result.errorMessage && (
              <p className="text-[11px] font-mono mt-2 bg-white/70 p-1.5 rounded border border-current/20">
                Error detail: {result.errorMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Multi-Step Cryptographic Verification Pipeline Checklist */}
      <div>
        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
          Server-Side Verification Pipeline ({result.checks.length} checks)
        </h4>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
          {result.checks.map((chk, idx) => (
            <div key={idx} className="p-3 flex items-start justify-between gap-3 bg-white">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {chk.passed ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{chk.step}</p>
                  <p className="text-[11px] text-slate-500">{chk.description}</p>
                  {chk.details && (
                    <p className="text-[11px] font-mono text-slate-600 mt-1">
                      Result: {chk.details}
                    </p>
                  )}
                </div>
              </div>

              <span className={`text-[11px] font-semibold font-mono ${chk.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                {chk.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Zero-Knowledge Predicate Evaluations */}
      {result.satisfiedPredicates.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
            Zero-Knowledge Predicate Results
          </h4>
          <div className="space-y-1.5">
            {result.satisfiedPredicates.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
              >
                <span className="font-mono text-slate-800">
                  {item.predicate.attributeLabel} {item.predicate.operator.toUpperCase()} {String(item.predicate.value)}
                </span>
                <span className={`font-semibold text-xs ${item.satisfied ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {item.satisfied ? 'Circuit Satisfied (ZK True)' : 'Failed (False)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclosed Claims Received by Verifier (Zero Privacy Leakage) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Plaintext Claims Received By Verifier Policy
          </h4>
          <span className="text-[11px] text-slate-400">
            Strict data minimization enforced
          </span>
        </div>

        {Object.keys(result.disclosedClaims).length === 0 ? (
          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Zero plaintext claims were shared. The verifier confirmed compliance purely via zero-knowledge math with zero data liability.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(result.disclosedClaims).map(([key, val]) => (
              <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                  {key}
                </span>
                <span className="font-mono text-slate-900 font-medium">{String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Meta Footer */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <span>Verified At: {formatDateTime(result.verifiedAt)}</span>
        <span>Issuer DID: {formatDid(result.issuerDid, 6)}</span>
        <span>Holder DID: {formatDid(result.holderDid, 6)}</span>
      </div>
    </div>
  );
};
