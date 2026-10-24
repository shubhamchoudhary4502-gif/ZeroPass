import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { ProofPredicate, RequestedClaim, PredicateOperator } from '../../types/proof';
import { Plus, Trash2, AlertCircle, Shield, Lock } from 'lucide-react';

interface CreatePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePolicyModal: React.FC<CreatePolicyModalProps> = ({ isOpen, onClose }) => {
  const { schemas, createPolicy } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSchemaId, setSelectedSchemaId] = useState<string>(schemas[0]?.id || '');
  const [predicates, setPredicates] = useState<ProofPredicate[]>([
    {
      attributeKey: 'age',
      attributeLabel: 'Age Requirement',
      operator: 'gte',
      value: 18,
      isZeroKnowledge: true,
    },
  ]);
  const [disclosedClaims, setDisclosedClaims] = useState<RequestedClaim[]>([
    {
      attributeKey: 'jurisdiction',
      attributeLabel: 'Jurisdiction Code',
      required: true,
      selectiveDisclosureAllowed: true,
    },
  ]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSchema = schemas.find((s) => s.id === selectedSchemaId) || schemas[0];

  const addPredicate = () => {
    if (!selectedSchema) return;
    const firstAttr = selectedSchema.attributes[0];
    setPredicates([
      ...predicates,
      {
        attributeKey: firstAttr.key,
        attributeLabel: firstAttr.name,
        operator: 'gte',
        value: 18,
        isZeroKnowledge: true,
      },
    ]);
  };

  const removePredicate = (index: number) => {
    setPredicates(predicates.filter((_, i) => i !== index));
  };

  const updatePredicate = (index: number, updates: Partial<ProofPredicate>) => {
    const updated = [...predicates];
    updated[index] = { ...updated[index], ...updates };
    setPredicates(updated);
  };

  const addDisclosedClaim = () => {
    if (!selectedSchema) return;
    const firstAttr = selectedSchema.attributes[0];
    setDisclosedClaims([
      ...disclosedClaims,
      {
        attributeKey: firstAttr.key,
        attributeLabel: firstAttr.name,
        required: true,
        selectiveDisclosureAllowed: true,
      },
    ]);
  };

  const removeDisclosedClaim = (index: number) => {
    setDisclosedClaims(disclosedClaims.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Policy title is required');
      return;
    }

    if (!selectedSchema) {
      setError('Please select a credential schema');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPolicy({
        title,
        description,
        credentialType: selectedSchema.type,
        schemaId: selectedSchema.id,
        predicates,
        disclosedClaims,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create verification policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Verification Policy"
      subtitle="Define zero-knowledge predicates and selective disclosure rules"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Policy Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Legal Adult Verification (18+) or Grant Income Threshold"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Credential Schema *
            </label>
            <select
              value={selectedSchemaId}
              onChange={(e) => setSelectedSchemaId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            >
              {schemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Policy Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explains what conditions are enforced"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Zero-Knowledge Predicates Section */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
                Zero-Knowledge Mathematical Predicates ({predicates.length})
              </label>
              <span className="text-[11px] text-slate-500">
                Proves condition without verifier learning the underlying value
              </span>
            </div>
            <button
              type="button"
              onClick={addPredicate}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Condition</span>
            </button>
          </div>

          <div className="space-y-2">
            {predicates.map((pred, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <select
                      value={pred.attributeKey}
                      onChange={(e) => {
                        const attr = selectedSchema?.attributes.find((a) => a.key === e.target.value);
                        updatePredicate(idx, {
                          attributeKey: e.target.value,
                          attributeLabel: attr?.name || e.target.value,
                        });
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                    >
                      {selectedSchema?.attributes.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.name} ({a.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={pred.operator}
                      onChange={(e) => updatePredicate(idx, { operator: e.target.value as PredicateOperator })}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    >
                      <option value="gte">&gt;= (Greater or equal)</option>
                      <option value="gt">&gt; (Greater than)</option>
                      <option value="lte">&lt;= (Less or equal)</option>
                      <option value="lt">&lt; (Less than)</option>
                      <option value="eq">== (Equals)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Value (e.g. 18 or 300000)"
                      value={pred.value}
                      onChange={(e) => {
                        const val = !isNaN(Number(e.target.value)) ? Number(e.target.value) : e.target.value;
                        updatePredicate(idx, { value: val });
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removePredicate(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove condition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclosed Claims Section */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider block">
                Selectively Disclosed Claims ({disclosedClaims.length})
              </label>
              <span className="text-[11px] text-slate-500">
                Attributes the verifier explicitly needs to read in plaintext
              </span>
            </div>
            <button
              type="button"
              onClick={addDisclosedClaim}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Claim</span>
            </button>
          </div>

          <div className="space-y-2">
            {disclosedClaims.map((claim, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-6">
                    <select
                      value={claim.attributeKey}
                      onChange={(e) => {
                        const attr = selectedSchema?.attributes.find((a) => a.key === e.target.value);
                        const updated = [...disclosedClaims];
                        updated[idx] = {
                          ...updated[idx],
                          attributeKey: e.target.value,
                          attributeLabel: attr?.name || e.target.value,
                        };
                        setDisclosedClaims(updated);
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                    >
                      {selectedSchema?.attributes.map((a) => (
                        <option key={a.key} value={a.key}>
                          {a.name} ({a.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`clm_req_${idx}`}
                      checked={claim.required}
                      onChange={(e) => {
                        const updated = [...disclosedClaims];
                        updated[idx] = { ...updated[idx], required: e.target.checked };
                        setDisclosedClaims(updated);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <label htmlFor={`clm_req_${idx}`} className="text-xs text-slate-600 select-none">
                      Mandatory for Verification
                    </label>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeDisclosedClaim(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove claim"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {isSubmitting ? 'Saving Policy...' : 'Save Verification Policy'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
