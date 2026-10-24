import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { VerifiableCredential } from '../../types/credential';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { formatDid } from '../../utils/formatters';

interface RevokeCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: VerifiableCredential | null;
}

export const RevokeCredentialModal: React.FC<RevokeCredentialModalProps> = ({
  isOpen,
  onClose,
  credential,
}) => {
  const { revokeCredential } = useApp();
  const [reason, setReason] = useState('Status changed - requirements no longer met');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!credential) return null;

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirmText.toLowerCase() !== 'revoke') {
      setError('Please type REVOKE to confirm on-chain status update');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await revokeCredential(credential.id, reason);
      if (!res.success) {
        setError(res.error || 'Failed to revoke credential');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Revocation error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke Cryptographic Credential"
      subtitle="Publish non-revocation accumulator update to decentralized registry"
      maxWidth="md"
    >
      <form onSubmit={handleRevoke} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Irreversible Status Change
          </p>
          <p>
            Once published to the cryptographic revocation list, any future verifier proof check against this credential will immediately report <strong>CREDENTIAL_REVOKED</strong>.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <p className="text-slate-500">
            Credential: <strong className="text-slate-800">{credential.schemaName}</strong>
          </p>
          <p className="text-slate-500 font-mono truncate">
            Subject: {formatDid(credential.credentialSubject.id, 10)}
          </p>
          <p className="text-slate-500 font-mono truncate">
            ID: {credential.id}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Revocation *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="Status changed - requirements no longer met">
              Status changed - requirements no longer met
            </option>
            <option value="Subject withdrew from academic program">
              Subject withdrew from academic program
            </option>
            <option value="Employment terminated">Employment terminated</option>
            <option value="Key compromise / identity rotation requested">
              Key compromise / identity rotation requested
            </option>
            <option value="Issued in administrative error">Issued in administrative error</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Type <span className="font-mono font-bold text-rose-600">REVOKE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="REVOKE"
            className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || confirmText.toLowerCase() !== 'revoke'}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-lg shadow-xs transition-colors"
          >
            {isSubmitting ? 'Publishing Revocation...' : 'Confirm Revocation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
