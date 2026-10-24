import React from 'react';
import { CredentialStatus } from '../../types/credential';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: CredentialStatus | 'valid' | 'invalid' | 'active' | 'revoked' | 'pending';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  switch (status) {
    case 'signed':
    case 'valid':
    case 'active':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{label || (status === 'signed' ? 'Cryptographically Signed' : 'Verified & Active')}</span>
        </span>
      );
    case 'draft':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <span>{label || 'Unsigned Draft'}</span>
        </span>
      );
    case 'validating':
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
          <span>{label || 'Validation in Progress'}</span>
        </span>
      );
    case 'revoked':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
          <span>{label || 'Revoked on Registry'}</span>
        </span>
      );
    case 'expired':
    case 'invalid':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span>{label || (status === 'expired' ? 'Expired' : 'Invalid Proof')}</span>
        </span>
      );
    default:
      return (
        <span className={`text-xs text-slate-600 ${className}`}>
          {label || status}
        </span>
      );
  }
};
