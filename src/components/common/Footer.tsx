import React from 'react';
import { Link } from 'react-router-dom';
import { ZeroPassLogo } from './ZeroPassLogo';
import { Shield, Lock, FileCode, CheckCircle, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <ZeroPassLogo size="md" />
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Decentralized identity infrastructure powered by zero-knowledge proofs and W3C Verifiable Credentials.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Non-custodial cryptographic verification</span>
            </div>
          </div>

          {/* Architecture */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Ecosystem
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/issuer" className="hover:text-indigo-600 transition-colors">
                  Issuer Portal & Schema Studio
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="hover:text-indigo-600 transition-colors">
                  Holder Wallet & Selective Disclosure
                </Link>
              </li>
              <li>
                <Link to="/verifier" className="hover:text-indigo-600 transition-colors">
                  Verifier Policy Engine & QR Bridge
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-indigo-600 transition-colors">
                  Trusted Issuer Registry
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Specs */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Standards & Protocols
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <span>W3C Verifiable Credentials Data Model v2.0</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Decentralized Identifiers (DIDs) v1.0</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Groth16 & SnarkJS Arithmetic Circuits</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Iden3 Query Language & Predicates</span>
              </li>
            </ul>
          </div>

          {/* Security & Developer */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Developer & Governance
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/developer" className="hover:text-indigo-600 transition-colors">
                  REST API & Webhooks
                </Link>
              </li>
              <li>
                <Link to="/developer" className="hover:text-indigo-600 transition-colors">
                  Cryptographic Verification SDK
                </Link>
              </li>
              <li className="text-slate-400">
                <span>Sandbox Testnet Environment</span>
              </li>
              <li className="text-slate-400">
                <span>Zero-Knowledge Proof Audit</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} ZeroPass Protocol.</span>
            <span>·</span>
            <span>Privacy-Preserving Decentralized Identity</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-slate-400">Development Seed Data Active</span>
            <Link to="/directory" className="hover:text-slate-900">
              Trust Anchors
            </Link>
            <Link to="/developer" className="hover:text-slate-900">
              API Specs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
