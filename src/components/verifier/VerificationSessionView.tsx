import React, { useState } from 'react';
import { ProofSession } from '../../types/proof';
import { QRCodeDisplay } from '../common/QRCodeDisplay';
import { VerificationResultCard } from './VerificationResultCard';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Smartphone, 
  Play, 
  X,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { formatDid } from '../../utils/formatters';

interface VerificationSessionViewProps {
  session: ProofSession;
  onClose: () => void;
}

export const VerificationSessionView: React.FC<VerificationSessionViewProps> = ({
  session,
  onClose,
}) => {
  const { credentials, submitProofToSession } = useApp();
  const [selectedCredId, setSelectedCredId] = useState<string>(credentials[0]?.id || '');
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(session.qrPayload);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimulateScan = async (credIdToUse?: string) => {
    const targetId = credIdToUse || selectedCredId;
    if (!targetId) return;

    setIsSimulating(true);
    try {
      await submitProofToSession(session.sessionId, targetId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Session Top Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Session: {session.sessionId}
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {session.policy.title}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Target Type: <strong className="font-mono text-slate-700">{session.policy.credentialType}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          Close Session
        </button>
      </div>

      <div className="p-6">
        {!session.result ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: QR Code Display for Wallet */}
            <div className="lg:col-span-5">
              <QRCodeDisplay
                value={session.qrPayload}
                size={210}
                label="Scan with ZeroPass Mobile Wallet"
                sublabel="Compatible with W3C VC and Iden3 protocol standards"
              />
            </div>

            {/* Right: Verification Status & Simulation Bridge */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Awaiting Wallet Presentation...</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The verification gateway is listening for a zero-knowledge proof presentation containing the required predicates.
                </p>
                <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                  <span>Policy ID: <strong className="font-mono text-slate-700">{session.policy.id}</strong></span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-semibold"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied Link' : 'Copy Deep Link'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Presentation Simulator for Testing Cryptographic Rules */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Test Server-Side Cryptographic Verification
                </h4>
                <p className="text-xs text-slate-500">
                  Select any credential to test the cryptographic verification pipeline (valid, revoked, expired, or unsigned):
                </p>

                <div className="space-y-2">
                  <select
                    value={selectedCredId}
                    onChange={(e) => setSelectedCredId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  >
                    {credentials.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.schemaName} [{c.status.toUpperCase()}] - Subject: {formatDid(c.credentialSubject.id, 6)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleSimulateScan()}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {isSimulating ? 'Executing Verification Pipeline...' : 'Simulate Presentation Verification'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Verification Result Display */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Cryptographic Verification Report</h3>
              <button
                type="button"
                onClick={() => handleSimulateScan()}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-verify</span>
              </button>
            </div>

            <VerificationResultCard result={session.result} />
          </div>
        )}
      </div>
    </div>
  );
};
