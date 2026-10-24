import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerifiableCredential } from '../../types/credential';
import { CredentialCard } from './CredentialCard';
import { CredentialDetailModal } from './CredentialDetailModal';
import { ProofRequestReviewModal } from './ProofRequestReviewModal';
import { PresentationHistoryTable } from './PresentationHistoryTable';
import { formatDid } from '../../utils/formatters';
import { 
  Wallet, 
  ShieldCheck, 
  Bell, 
  History, 
  Layers, 
  Key, 
  Lock,
  ArrowRight,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';

export const HolderWallet: React.FC = () => {
  const { 
    currentUser, 
    holderCredentials, 
    presentations, 
    pendingHolderRequest 
  } = useApp();

  const [selectedCredForDetail, setSelectedCredForDetail] = useState<VerifiableCredential | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'history'>('credentials');
  const [copiedDid, setCopiedDid] = useState(false);

  const handleCopyDid = () => {
    navigator.clipboard.writeText(currentUser.did);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Wallet Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Identity Ecosystem</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Holder Self-Custodial Wallet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Decentralized Credential Wallet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Self-sovereign digital vault. Store W3C credentials, selectively disclose claims, and generate Zero-Knowledge proofs locally.
          </p>
        </div>

        {/* DID Address Bar */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Holder Identifier (DID)
            </span>
            <span className="text-xs font-mono text-slate-800 font-medium">
              {formatDid(currentUser.did, 10)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyDid}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded ml-2 border border-slate-200 transition-colors"
            title="Copy DID"
            aria-label="Copy Holder DID"
          >
            {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Pending Proof Request Banner if active */}
      {pendingHolderRequest && (
        <div className="p-5 bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-xl text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Bell className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Pending Proof Request Waiting For Review</span>
            </div>
            <h3 className="text-base font-bold text-white">
              {pendingHolderRequest.verifierName} is requesting verification
            </h3>
            <p className="text-xs text-indigo-200 max-w-2xl">
              Policy: <strong>{pendingHolderRequest.policy.title}</strong> — {pendingHolderRequest.policy.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-indigo-50 rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <span>Review & Selectively Disclose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('credentials')}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'credentials'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>My Credentials ({holderCredentials.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Presentation History ({presentations.length})</span>
        </button>
      </div>

      {/* Tab 1: Credentials Grid */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          {holderCredentials.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">No Credentials in Wallet</h3>
              <p className="text-xs text-slate-400 mt-1">
                You can receive credentials from an Issuer Authority in the Issuer Portal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {holderCredentials.map((cred) => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  onViewDetails={setSelectedCredForDetail}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Presentation History */}
      {activeTab === 'history' && (
        <PresentationHistoryTable presentations={presentations} />
      )}

      {/* Modals */}
      <CredentialDetailModal
        isOpen={!!selectedCredForDetail}
        onClose={() => setSelectedCredForDetail(null)}
        credential={selectedCredForDetail}
      />

      <ProofRequestReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        session={pendingHolderRequest}
      />
    </div>
  );
};
