import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  EyeOff, 
  Layers, 
  ArrowRight, 
  Building2, 
  Wallet, 
  CheckCircle2, 
  Key, 
  Lock, 
  FileCheck, 
  Smartphone, 
  Sparkles,
  ChevronRight,
  Database,
  QrCode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LandingPage: React.FC = () => {
  const { switchRole } = useApp();
  const [activeTab, setActiveTab] = useState<'issuer' | 'holder' | 'verifier'>('holder');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 bg-linear-to-b from-white via-slate-50/50 to-white">
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1E1B4B 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline and CTAs */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50/80 border border-indigo-100 rounded-md text-xs font-semibold text-indigo-800 mb-6">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Zero-Knowledge Verifiable Identity Infrastructure</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6 text-balance">
                Your credentials. <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-800">
                  Your privacy.
                </span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mb-8">
                ZeroPass brings zero-knowledge cryptography to decentralized identity. Prove legal age without disclosing your birth date, demonstrate active student status without revealing your transcript, and prove accredited qualifications with cryptographic mathematical certainty.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/wallet"
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-2"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <span>How It Works</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-3 gap-6 text-slate-600">
                <div>
                  <p className="text-xl font-bold text-slate-900 font-mono">100%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Selective Disclosure</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 font-mono">&lt; 150ms</p>
                  <p className="text-xs text-slate-500 mt-0.5">Proof Verification</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 font-mono">W3C VC</p>
                  <p className="text-xs text-slate-500 mt-0.5">Open Standards</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Cryptographic Proof Simulation Card */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="text-xs font-semibold text-slate-900">Zero-Knowledge Verification Circuit</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 font-medium">Valid Proof</span>
                </div>

                {/* Visual circuit comparison: What Holder Owns vs What Verifier Learns */}
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Private Credential Claims (Holder Only)
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Legal Name:</span>
                        <span className="font-mono text-slate-800">Elena Rostova</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/50">
                        <span className="text-slate-500">Date of Birth:</span>
                        <span className="font-mono text-slate-800">2002-04-18 (Hidden)</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">National ID:</span>
                        <span className="font-mono text-slate-800">***-**-7190 (Encrypted)</span>
                      </div>
                    </div>
                  </div>

                  {/* ZK Mathematical Transformation */}
                  <div className="flex items-center justify-center gap-2 py-1 text-xs text-indigo-600 font-medium">
                    <EyeOff className="w-4 h-4" />
                    <span>Mathematical Snark Circuit: age ≥ 18</span>
                  </div>

                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                    <p className="text-[11px] font-semibold text-indigo-950 uppercase tracking-wider mb-2">
                      What Verifier Receives (Zero-Knowledge)
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-emerald-800 font-medium">
                        <span>Condition "Age ≥ 18":</span>
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          PROVED TRUE
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Birthdate Disclosed:</span>
                        <span className="font-mono text-slate-500">NULL (Zero-Knowledge)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Issuer Digital Signature:</span>
                        <span className="font-mono text-xs text-indigo-700">Ed25519 Valid</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Cryptographic Algorithm</span>
                  <span className="font-mono text-slate-700">Groth16 / BN254</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Tri-Party Model Section */}
      <section id="architecture" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Architecture & Trust Triangle
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
              Decentralized Tri-Party Verification
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Verifiable credentials replace centralized logins with a cryptographic triangle. Issuers sign assertions once; holders store credentials in sovereign self-custodial wallets; verifiers mathematically authenticate assertions without phoning home to the issuer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Issuer */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">1. The Issuer</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Universities, governments, employers, and banks define schema standards and cryptographically sign credentials using their decentralized identifier (DID) and private key.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Schema definitions & attribute rules</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Cryptographic digital signatures</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>On-chain revocation accumulator registries</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link
                  to="/issuer"
                  onClick={() => switchRole('issuer')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <span>Open Issuer Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Holder Wallet */}
            <div className="p-6 bg-indigo-50/50 border border-indigo-200 rounded-xl flex flex-col justify-between relative shadow-xs">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-5">
                  <Wallet className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">2. The Holder Wallet</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Users own and control their credentials in a sovereign identity wallet. When asked to verify an attribute, holders choose exactly what to disclose and generate zero-knowledge proofs locally.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Self-custodial claim storage</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Granular selective disclosure control</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Local zero-knowledge proof generation</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-indigo-200">
                <Link
                  to="/wallet"
                  onClick={() => switchRole('holder')}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
                >
                  <span>Open Holder Wallet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Verifier */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">3. The Verifier</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Relying parties define verification policies (e.g. age &gt; 18, accredited investor, active student), broadcast QR requests, and instantly verify proofs against trust registries without holding user data.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Custom cryptographic policy engine</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Zero data liability & GDPR minimization</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Offline-verifiable cryptographic assurance</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link
                  to="/verifier"
                  onClick={() => switchRole('verifier')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <span>Open Verifier Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works & Workflow Section */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              End-to-End Workflow
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
              How Credentials Move Between Participants
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Experience the friction-free, non-custodial flow from issuance to verification in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 border border-slate-200 rounded-xl relative">
              <span className="text-xs font-mono font-bold text-indigo-600">01. SCHEMA CREATION</span>
              <h4 className="text-base font-semibold text-slate-900 mt-2 mb-1.5">Define Data Schema</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Issuer defines standard JSON-LD schema with typed attributes, validation rules, and publishes to schema registries.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-xl relative">
              <span className="text-xs font-mono font-bold text-indigo-600">02. SIGN & ISSUE</span>
              <h4 className="text-base font-semibold text-slate-900 mt-2 mb-1.5">Sign & Deliver</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Issuer validates claims and creates a cryptographic signature over the credential, anchoring status to a revocation accumulator.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-xl relative">
              <span className="text-xs font-mono font-bold text-indigo-600">03. SELECTIVE PROOF</span>
              <h4 className="text-base font-semibold text-slate-900 mt-2 mb-1.5">Generate ZK Proof</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Holder scans verifier's QR code, reviews requested attributes, selectively hides private fields, and generates a mathematical proof.
              </p>
            </div>

            <div className="bg-white p-6 border border-slate-200 rounded-xl relative">
              <span className="text-xs font-mono font-bold text-indigo-600">04. CRYPTO VERIFY</span>
              <h4 className="text-base font-semibold text-slate-900 mt-2 mb-1.5">Instant Verification</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verifier validates the signature and circuit proof in sub-second latency without calling the issuer or storing user data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Platform Features
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">
              Engineered for Enterprise Compliance & User Sovereignty
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <Layers className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Credential Portability</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Export and import W3C compliant credentials across any decentralized wallet or ecosystem without vendor lock-in.
              </p>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <EyeOff className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Selective Disclosure</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose precisely which claims to reveal. Never share your entire identity card when only a single predicate is required.
              </p>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <Lock className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Zero-Knowledge Trust</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prove numerical inequalities (age ≥ 18, income &lt; threshold) without revealing the underlying value to verifiers.
              </p>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
              <Database className="w-6 h-6 text-indigo-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Decentralized Registry</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cryptographic trust anchors and revocation status lists verified via public state registries with non-repudiation.
              </p>
            </div>
          </div>

          {/* Banner CTA */}
          <div className="mt-16 p-8 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold mb-2">Ready to explore verifiable identity?</h4>
              <p className="text-xs text-slate-400 max-w-xl">
                Switch between Issuer, Holder Wallet, and Verifier portals to test real zero-knowledge credential flows with deterministic sandbox data.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/wallet"
                className="px-5 py-2.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors"
              >
                Open Holder Wallet
              </Link>
              <Link
                to="/issuer"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Open Issuer Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
