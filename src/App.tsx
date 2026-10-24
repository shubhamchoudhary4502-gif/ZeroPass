/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { NotificationToast } from './components/common/NotificationToast';
import { LandingPage } from './components/landing/LandingPage';
import { IssuerDashboard } from './components/issuer/IssuerDashboard';
import { HolderWallet } from './components/holder/HolderWallet';
import { VerifierDashboard } from './components/verifier/VerifierDashboard';
import { TrustedIssuerDirectory } from './components/directory/TrustedIssuerDirectory';
import { DeveloperDashboard } from './components/developer/DeveloperDashboard';
import { SettingsView } from './components/auth/SettingsView';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/issuer" element={<IssuerDashboard />} />
              <Route path="/wallet" element={<HolderWallet />} />
              <Route path="/verifier" element={<VerifierDashboard />} />
              <Route path="/directory" element={<TrustedIssuerDirectory />} />
              <Route path="/developer" element={<DeveloperDashboard />} />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <NotificationToast />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
