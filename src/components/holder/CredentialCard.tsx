import React from 'react';
import { VerifiableCredential } from '../../types/credential';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate, formatDid } from '../../utils/formatters';
import { ShieldCheck, Award, GraduationCap, Briefcase, Eye } from 'lucide-react';

interface CredentialCardProps {
  credential: VerifiableCredential;
  onViewDetails: (credential: VerifiableCredential) => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential,
  onViewDetails,
}) => {
  const getIcon = () => {
    const type = credential.type.join(' ');
    if (type.includes('Student')) return GraduationCap;
    if (type.includes('Scholarship') || type.includes('Award')) return Award;
    if (type.includes('Employment')) return Briefcase;
    return ShieldCheck;
  };

  const IconComponent = getIcon();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between group">
      <div>
        {/* Top bar: Schema name and Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <IconComponent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {credential.schemaName}
              </h3>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                {credential.issuer.name}
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mb-4">
          <StatusBadge status={credential.status} />
        </div>

        {/* Claims Sample */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs mb-4">
          {Object.entries(credential.credentialSubject)
            .filter(([k]) => k !== 'id')
            .slice(0, 3)
            .map(([key, val]) => (
              <div key={key} className="flex justify-between items-center text-slate-600">
                <span className="capitalize text-slate-400 text-[11px]">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="font-medium text-slate-800 font-mono truncate max-w-[140px]">
                  {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Dates and Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          <span className="text-[11px] text-slate-400 block">Valid until</span>
          <span className="font-mono text-slate-700 text-xs tabular-nums">
            {formatDate(credential.expirationDate)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onViewDetails(credential)}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors inline-flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      </div>
    </div>
  );
};
