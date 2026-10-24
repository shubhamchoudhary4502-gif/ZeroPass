import React from 'react';
import { PresentationRecord } from '../../types/proof';
import { formatDateTime, formatDid } from '../../utils/formatters';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

interface PresentationHistoryTableProps {
  presentations: PresentationRecord[];
}

export const PresentationHistoryTable: React.FC<PresentationHistoryTableProps> = ({
  presentations,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <div className="p-5 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Presentation History & Audit Log</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Verifiable ledger of all cryptographic proof presentations and selective disclosure authorizations from this wallet.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Verifier / Relying Party</th>
              <th className="py-3 px-4">Credential</th>
              <th className="py-3 px-4">Proved Predicates (ZK)</th>
              <th className="py-3 px-4">Disclosed Claims</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {presentations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No presentations recorded yet.
                </td>
              </tr>
            ) : (
              presentations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                    {formatDateTime(item.timestamp)}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{item.verifierName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDid(item.verifierDid, 6)}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    {item.credentialTitle}
                  </td>

                  <td className="py-3 px-4">
                    {item.predicatesProved.length > 0 ? (
                      <div className="space-y-0.5">
                        {item.predicatesProved.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-block text-[11px] font-mono text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded mr-1 mb-1 border border-indigo-100"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {item.claimsDisclosed.length > 0 ? (
                      <span className="text-slate-700 font-mono">
                        {item.claimsDisclosed.join(', ')}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">100% Zero-Knowledge</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {item.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Rejected
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
