import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { SchemaAttribute, AttributeType } from '../../types/credential';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, Layers, AlertCircle } from 'lucide-react';

interface CreateSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSchemaModal: React.FC<CreateSchemaModalProps> = ({ isOpen, onClose }) => {
  const { createSchema } = useApp();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<Omit<SchemaAttribute, 'id'>[]>([
    { name: 'Subject Name', key: 'subjectName', type: 'string', required: true, description: 'Subject full legal name' },
    { name: 'Eligibility Met', key: 'eligibilityMet', type: 'boolean', required: true, description: 'Boolean qualification flag' },
  ]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAttribute = () => {
    setAttributes([
      ...attributes,
      { name: '', key: '', type: 'string', required: false, description: '' },
    ]);
  };

  const removeAttribute = (index: number) => {
    if (attributes.length <= 1) {
      setError('A schema must define at least one attribute');
      return;
    }
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: keyof Omit<SchemaAttribute, 'id'>, value: any) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    // Auto-generate key from name if key was empty
    if (field === 'name' && (!updated[index].key || updated[index].key === '')) {
      updated[index].key = value.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    }
    setAttributes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Schema name is required');
      return;
    }
    if (!type.trim()) {
      setError('Credential type is required (e.g. StudentStatusCredential)');
      return;
    }

    for (let i = 0; i < attributes.length; i++) {
      if (!attributes[i].name.trim() || !attributes[i].key.trim()) {
        setError(`Attribute #${i + 1} must have a name and a key`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createSchema({
        name,
        type: type.trim(),
        version: version.trim() || '1.0.0',
        description,
        schemaUri: `https://schema.zeropass.network/v1/${type.trim()}.json`,
        attributes: attributes.map((a, idx) => ({ ...a, id: `attr_${Date.now()}_${idx}` })),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create schema');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Credential Schema"
      subtitle="Define cryptographic schema attributes and validation rules for your organization"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Schema Display Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Scholarship Eligibility"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Credential Type *
            </label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. ScholarshipEligibilityCredential"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Version Tag
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Schema Purpose / Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explains what this credential certifies"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Dynamic Attributes List */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Schema Claims & Attributes ({attributes.length})
            </label>
            <button
              type="button"
              onClick={addAttribute}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Field</span>
            </button>
          </div>

          <div className="space-y-3">
            {attributes.map((attr, index) => (
              <div
                key={index}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Attribute Label (e.g. Annual Income)"
                      value={attr.name}
                      onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="keyName"
                      value={attr.key}
                      onChange={(e) => updateAttribute(index, 'key', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={attr.type}
                      onChange={(e) => updateAttribute(index, 'type', e.target.value as AttributeType)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="date">date</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`req_${index}`}
                      checked={attr.required}
                      onChange={(e) => updateAttribute(index, 'required', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <label htmlFor={`req_${index}`} className="text-xs text-slate-600 select-none">
                      Required
                    </label>
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove attribute"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
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
            {isSubmitting ? 'Registering Schema...' : 'Register Schema to Network'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
