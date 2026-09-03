import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  X,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { User, Settings } from '../types';
import { storage } from '../services/storageService';
import { MysarBrandBadge } from './MysarBrandBadge';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  settings?: Settings;
  availableUsers?: User[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  settings,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const authResult = storage.authenticateUser(identifier, password);
      setIsLoading(false);

      if (authResult.success && authResult.user) {
        storage.setSessionUser(authResult.user, rememberMe);
        onLoginSuccess(authResult.user);
      } else {
        setErrorMessage(authResult.error || 'Invalid credentials. Please verify and try again.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-white text-slate-800 flex selection:bg-[#EAF7EF] selection:text-[#0B5D2A]">
      {/* 
        MAIN SPLIT LAYOUT AS IN PRESENTATION SLIDE:
        - Left: Clean White Canvas (76% width on desktop)
        - Right: Solid Deep Brand Green Band (#235E3F) (24% width on desktop)
        - Circular MYSAR emblem centered directly on the dividing line
      */}

      {/* LEFT SECTION (Main Form & Brand Content) */}
      <div className="w-full lg:w-[76%] xl:w-[77%] min-h-screen flex flex-col justify-between relative z-10 px-6 sm:px-12 lg:px-16 py-6 md:py-8 bg-white">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {settings?.companyLogo ? (
              <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
                <img
                  src={settings.companyLogo}
                  alt="Company Logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#235E3F] flex items-center justify-center text-white font-black text-sm shadow-2xs">
                M
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  {settings?.brandName ? (settings.brandName.includes('ERP') ? settings.brandName : `${settings.brandName} ERP`) : 'MYSAR ERP'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#235E3F] border border-[#D9E5DD] uppercase tracking-wider">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {settings?.companyName || 'Casbiro Solutions Private Limited'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center text-[11px] font-bold text-[#235E3F] bg-[#EAF7EF] px-3 py-1 rounded-full border border-[#D9E5DD] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#235E3F] mr-2 animate-pulse"></span>
              Google Sheets Live
            </span>
          </div>
        </header>

        {/* Center Content & Login Card */}
        <main className="flex-1 flex items-center justify-center py-8 lg:py-12">
          <div className="w-full max-w-[430px] space-y-6">
            {/* Mobile / Tablet Logo Badge (Shown only when right panel is hidden) */}
            <div className="lg:hidden flex justify-center pb-2">
              <MysarBrandBadge size="md" />
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xl shadow-slate-900/5 overflow-hidden">
              {/* Card Header */}
              <div className="px-7 pt-7 pb-5 border-b border-gray-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="inline-flex p-2.5 rounded-xl bg-[#EAF7EF] text-[#235E3F]">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Sign In
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Sign in to {settings?.brandName ? (settings.brandName.includes('ERP') ? settings.brandName : `${settings.brandName} ERP`) : 'MYSAR ERP'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Institutional ERP & Proposal Engine
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-7 space-y-4">
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3.5 rounded-xl flex items-start space-x-2.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{errorMessage}</div>
                  </div>
                )}

                {/* Identifier Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    User ID / Login ID or Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. rafeeh or rafeeh.vk"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full bg-slate-50/70 border border-gray-200 text-slate-800 placeholder:text-slate-400 text-xs md:text-sm rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-[#235E3F] focus:ring-3 focus:ring-[#235E3F]/15 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[11px] font-bold text-[#235E3F] hover:underline transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full bg-slate-50/70 border border-gray-200 text-slate-800 placeholder:text-slate-400 text-xs md:text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:bg-white focus:border-[#235E3F] focus:ring-3 focus:ring-[#235E3F]/15 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#235E3F] border-gray-300 focus:ring-[#235E3F]"
                    />
                    <span className="font-medium">Keep me signed in</span>
                  </label>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#235E3F] hover:bg-[#1a4a31] text-white py-3 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#235E3F]/20 hover:shadow-lg active:scale-98 disabled:opacity-75 disabled:pointer-events-none mt-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to MYSAR ERP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Feature Badges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 border border-gray-200/70 p-3 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-[#235E3F] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-700">RBAC Security</div>
                <div className="text-[9px] text-slate-500 font-medium">Multi-level Roles</div>
              </div>
              <div className="bg-slate-50 border border-gray-200/70 p-3 rounded-xl">
                <FileSpreadsheet className="w-4 h-4 text-[#235E3F] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-700">Google Sheets</div>
                <div className="text-[9px] text-slate-500 font-medium">Real-time sync</div>
              </div>
              <div className="bg-slate-50 border border-gray-200/70 p-3 rounded-xl">
                <FileText className="w-4 h-4 text-[#235E3F] mx-auto mb-1" />
                <div className="text-[11px] font-bold text-slate-700">PDF Proposals</div>
                <div className="text-[9px] text-slate-500 font-medium">14-Page Auto Deck</div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="pt-4 text-xs text-slate-400 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {settings?.companyName || 'Casbiro Solutions Private Limited'} &copy; {new Date().getFullYear()} &bull; All rights reserved
          </p>
          <p className="text-slate-400 font-medium">
            MYSAR ERP System v2.4
          </p>
        </footer>
      </div>

      {/* 
        RIGHT SECTION: Solid Deep Forest Green Band (#235E3F)
        Taking 24% width on desktop matching Presentation1.png 
      */}
      <div className="hidden lg:block lg:w-[24%] xl:w-[23%] min-h-screen bg-[#235E3F] relative select-none">
        {/* Subtle decorative quote / branding at bottom of green panel */}
        <div className="absolute bottom-8 right-8 left-8 text-center text-emerald-100/40 text-[11px] font-medium tracking-wide">
          Transforming Education Through Smart Digital Solutions
        </div>
      </div>

      {/* 
        CIRCULAR BRAND BADGE:
        Straddling the exact vertical boundary between the White Left Area and the Green Right Column
      */}
      <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-[24%] xl:right-[23%] translate-x-1/2 z-30 pointer-events-none">
        <MysarBrandBadge size="lg" />
      </div>

      {/* Forgot Password / Help Dialog */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-150 text-slate-800">
            <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-[#235E3F]" />
                <h3 className="font-bold text-slate-800 text-sm">Account Access & Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-[#EAF7EF] border border-[#D9E5DD] p-3.5 rounded-xl text-[#235E3F] space-y-1">
                <div className="font-bold text-xs flex items-center space-x-1.5 text-[#235E3F]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#235E3F]" />
                  <span>Default Account Password</span>
                </div>
                <p className="text-[11px] text-slate-700">
                  All default team accounts use the initial password: <br />
                  <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-slate-800 inline-block mt-1">
                    Password@123
                  </strong>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs">How to Reset or View Credentials:</h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>Log in as an <strong>Administrator</strong> (e.g. <code>rafeeh</code> or <code>rafeeh.vk</code>).</li>
                  <li>Navigate to <strong>Settings &rarr; Team & RBAC Manager</strong>.</li>
                  <li>Locate the member row to reveal their password or click <strong>Edit</strong> to update their password.</li>
                  <li>All changes automatically sync to your Google Sheets Users database.</li>
                </ol>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full bg-[#235E3F] hover:bg-[#1a4a31] text-white py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


