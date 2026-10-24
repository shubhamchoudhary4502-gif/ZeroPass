import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { CredentialSchema } from '../../types/credential';
import { validateDid } from '../../utils/zkEngine';
import { ShieldCheck, AlertCircle, FileCheck2, User, Calendar } from 'lucide-react';

interface IssueCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSchemaId?: string;
}

export const IssueCredentialModal: React.FC<IssueCredentialModalProps> = ({
  isOpen,
  onClose,
  preselectedSchemaId,
}) => {
  const { schemas, issueCredential, currentUser } = useApp();
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>(
    preselectedSchemaId || (schemas[0]?.id ?? '')
  );
  const [holderDid, setHolderDid] = useState('did:zeropass:testnet:holder:elena99321');
  const [claims, setClaims] = useState<Record<string, any>>({});
  const [expirationMonths, setExpirationMonths] = useState(12);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeSchema = schemas.find((s) => s.id === selectedSchemaId) || schemas[0];

  useEffect(() => {
    if (preselectedSchemaId) {
      setSelectedSchemaId(preselectedSchemaId);
    }
  }, [preselectedSchemaId]);

  // Seed default claim values when schema changes
  useEffect(() => {
    if (activeSchema) {
      const defaults: Record<string, any> = {};
      activeSchema.attributes.forEach((attr) => {
        if (attr.type === 'boolean') defaults[attr.key] = true;
        else if (attr.type === 'number') defaults[attr.key] = attr.key.includes('Year') ? 2027 : 24;
        else if (attr.type === 'date') defaults[attr.key] = '2002-04-18';
        else defaults[attr.key] = attr.key.includes('Name') ? 'Elena Rostova' : 'ACTIVE';
      });
      setClaims(defaults);
    }
  }, [activeSchema]);

  const handleClaimChange = (key: string, value: any) => {
    setClaims((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate DID
    const didValidation = validateDid(holderDid);
    if (!didValidation.isValid) {
      setError(didValidation.error || 'Invalid Holder DID syntax');
      return;
    }

    if (!activeSchema) {
      setError('Please select a schema');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await issueCredential({
        schemaId: activeSchema.id,
        holderDid: holderDid.trim(),
        claims,
        expirationMonths,
      });

      if (!res.success) {
        setError(res.error || 'Issuance validation failed on backend');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Issuance failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Cryptographic Credential"
      subtitle="Execute backend schema validation, Merkle accumulator registration, and Ed25519 signing"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Schema Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Credential Schema *
          </label>
          <select
            value={selectedSchemaId}
            onChange={(e) => setSelectedSchemaId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            {schemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.type} - v{s.version})
              </option>
            ))}
          </select>
          {activeSchema && (
            <p className="text-[11px] text-slate-500 mt-1">{activeSchema.description}</p>
          )}
        </div>

        {/* Holder DID Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Subject / Holder Decentralized Identifier (DID) *
          </label>
          <div className="relative">
            <input
              type="text"
              value={holderDid}
              onChange={(e) => setHolderDid(e.target.value)}
              placeholder="did:zeropass:testnet:holder:..."
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard W3C DID format. The issued credential will be bound cryptographically to this public identifier.
          </p>
        </div>

        {/* Dynamic Claims Form based on Schema Attributes */}
        {activeSchema && (
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Credential Subject Attributes ({activeSchema.attributes.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSchema.attributes.map((attr) => (
                <div key={attr.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className="block text-xs font-semibold text-slate-800 mb-0.5">
                    {attr.name} {attr.required && <span className="text-rose-500">*</span>}
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">{attr.description || `Key: ${attr.key}`}</p>

                  {attr.type === 'boolean' ? (
                    <select
                      value={claims[attr.key] ? 'true' : 'false'}
                      onChange={(e) => handleClaimChange(attr.key, e.target.value === 'true')}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    >
                      <option value="true">True (Eligible / Verified)</option>
                      <option value="false">False (Ineligible)</option>
                    </select>
                  ) : attr.type === 'date' ? (
                    <input
                      type="date"
                      value={claims[attr.key] || ''}
                      onChange={(e) => handleClaimChange(attr.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      required={attr.required}
                    />
                  ) : attr.type === 'number' ? (
                    <input
                      type="number"
                      value={claims[attr.key] !== undefined ? claims[attr.key] : ''}
                      onChange={(e) => handleClaimChange(attr.key, Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                      required={attr.required}
                    />
                  ) : (
                    <input
                      type="text"
                      value={claims[attr.key] || ''}
                      onChange={(e) => handleClaimChange(attr.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                      required={attr.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validity & Expiration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Validity Duration
            </label>
            <select
              value={expirationMonths}
              onChange={(e) => setExpirationMonths(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            >
              <option value={6}>6 Months</option>
              <option value={12}>1 Year (12 Months)</option>
              <option value={24}>2 Years</option>
              <option value={36}>3 Years</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Signing Authority
            </label>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span className="font-semibold text-slate-900 block truncate">
                {currentUser.organization || currentUser.name}
              </span>
              <span className="font-mono text-[11px] text-slate-400 block truncate">
                {currentUser.did}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Validating & Signing...' : 'Sign & Issue Credential'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
