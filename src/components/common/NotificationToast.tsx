import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification } = useApp();

  if (!notification) return null;

  const { message, type } = notification;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-indigo-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-rose-600 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-200 text-slate-800',
    info: 'bg-white border-indigo-200 text-slate-800',
    warning: 'bg-white border-amber-200 text-slate-800',
    error: 'bg-white border-rose-200 text-slate-800',
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-md text-xs font-medium ${bgStyles[type]}`}
      >
        {icons[type]}
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
};
