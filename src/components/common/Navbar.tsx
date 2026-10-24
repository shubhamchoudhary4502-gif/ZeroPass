import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ZeroPassLogo } from './ZeroPassLogo';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types/auth';
import { Menu, X, Shield, Wallet, Building2, Terminal, BookOpen, UserCheck } from 'lucide-react';
import { formatDid } from '../../utils/formatters';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, switchRole } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'Issuer Portal', path: '/issuer' },
    { label: 'Holder Wallet', path: '/wallet' },
    { label: 'Verifier Portal', path: '/verifier' },
    { label: 'Trust Registry', path: '/directory' },
    { label: 'Developers', path: '/developer' },
  ];

  const roleLabels: Record<UserRole, { label: string; desc: string; icon: any }> = {
    holder: { label: 'Holder Wallet', desc: 'Elena Rostova (Graduate)', icon: Wallet },
    issuer: { label: 'Issuer Authority', desc: 'Helios Polytechnic', icon: Building2 },
    verifier: { label: 'Verifier Portal', desc: 'Meridian Capital Audit', icon: Shield },
    developer: { label: 'Developer Admin', desc: 'ZeroPass API Console', icon: Terminal },
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const CurrentRoleIcon = roleLabels[currentUser.role]?.icon || UserCheck;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link to="/" className="flex items-center shrink-0">
          <ZeroPassLogo size="md" />
        </Link>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                isActive(link.path)
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                  : 'hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Persona Switcher & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Persona / Role Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
              aria-expanded={roleDropdownOpen}
              aria-haspopup="true"
              aria-label="Switch active identity persona"
            >
              <CurrentRoleIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline font-semibold">{roleLabels[currentUser.role]?.label}</span>
              <span className="text-slate-400">▾</span>
            </button>

            {roleDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulate Persona
                  </p>
                  <p className="text-xs text-slate-600 font-mono truncate">
                    {formatDid(currentUser.did, 8)}
                  </p>
                </div>

                {(['holder', 'issuer', 'verifier', 'developer'] as UserRole[]).map((r) => {
                  const item = roleLabels[r];
                  const Icon = item.icon;
                  const isSelected = currentUser.role === r;

                  return (
                    <button
                      key={r}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        switchRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                        isSelected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <p className="text-xs font-semibold">{item.label}</p>
                        <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick link to Current Persona's Workspace */}
          <Link
            to={
              currentUser.role === 'issuer'
                ? '/issuer'
                : currentUser.role === 'verifier'
                ? '/verifier'
                : currentUser.role === 'developer'
                ? '/developer'
                : '/wallet'
            }
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            Launch {currentUser.role === 'holder' ? 'Wallet' : 'Console'}
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
