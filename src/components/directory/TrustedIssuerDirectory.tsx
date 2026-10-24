import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TrustedIssuer, TrustStatus } from '../../types/issuer';
import { formatDid } from '../../utils/formatters';
import { 
  Building2, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  Award, 
  Globe, 
  Info,
  Filter
} from 'lucide-react';

export const TrustedIssuerDirectory: React.FC = () => {
  const { trustedIssuers } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Education', 'Government & Civic', 'Financial & Corporate', 'Healthcare'];

  const filteredIssuers = trustedIssuers.filter((iss) => {
    const matchesSearch =
      iss.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.did.toLowerCase().includes(searchQuery.toLowerCase()) ||
      iss.supportedCredentialTypes.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || iss.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getTrustStatusBadge = (status: TrustStatus) => {
    switch (status) {
      case 'VERIFIED_TRUST_ANCHOR':
        return (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Trust Anchor
          </span>
        );
      case 'ACCREDITED_INSTITUTION':
        return (
          <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1">
            <Award className="w-3 h-3 text-indigo-600" />
            Accredited Institution
          </span>
        );
      case 'REGISTERED_ENTERPRISE':
        return (
          <span className="text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-600" />
            Registered Enterprise
          </span>
        );
      case 'COMMUNITY_VERIFIED':
      default:
        return (
          <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            Community Verified
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Identity Ecosystem</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">Public Trust Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Trusted Credential Issuer Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Decentralized registry of verified issuing authorities, cryptographic trust anchors, and supported schemas.
          </p>
        </div>

        {/* Development Seed Data Disclaimer Notice */}
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-md">
          <p className="font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            Sandbox Environment Notice
          </p>
          <p className="text-[11px] mt-0.5 text-amber-700">
            All listed entities are fictional sandbox entities created for development and protocol verification. No real government agency or accredited institution is claimed.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search issuer name, DID, or credential type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Issuers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredIssuers.map((issuer) => (
          <div
            key={issuer.id}
            className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{issuer.name}</h3>
                    <p className="text-xs text-slate-500">{issuer.category}</p>
                  </div>
                </div>

                <div>{getTrustStatusBadge(issuer.trustStatus)}</div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {issuer.description}
              </p>

              {/* Technical Trust Details */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 text-xs mb-4">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Issuer DID:</span>
                  <span className="font-mono text-slate-800 font-medium truncate max-w-[220px]">
                    {issuer.did}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Verification Method:</span>
                  <span className="font-medium text-slate-800">{issuer.verificationMethod}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Key Fingerprint:</span>
                  <span className="font-mono text-slate-800">{issuer.publicKeyFingerprint}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-slate-400 text-[11px]">Active Credentials Issued:</span>
                  <span className="font-mono text-slate-800 tabular-nums font-semibold">
                    {issuer.activeCredentialsIssued.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Supported Credential Types */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Supported Credential Schemas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {issuer.supportedCredentialTypes.map((type) => (
                    <span
                      key={type}
                      className="text-xs font-mono text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom link */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Established: {issuer.establishedDate}</span>
              <a
                href={issuer.website}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-semibold"
              >
                <span>Audit Anchor</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
