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
} from 'lucide-react';
import { User, Settings } from '../types';
import { storage } from '../services/storageService';

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
    <div className="min-h-screen relative overflow-hidden bg-[#F7FAF8] text-[#1F2937] flex flex-col justify-between selection:bg-[#EAF7EF] selection:text-[#0B5D2A]">
      {/* Decorative Brand Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle geometric dot matrix */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(#168A45 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Soft emerald theme gradient orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#EAF7EF] blur-3xl opacity-80" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#168A45]/10 blur-3xl opacity-80" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-[#EAF7EF]/60 blur-[100px] pointer-events-none" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 h-16 md:h-20 px-6 md:px-12 flex items-center justify-between border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          {settings?.companyLogo ? (
            <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 p-1.5 flex items-center justify-center overflow-hidden shadow-2xs">
              <img
                src={settings.companyLogo}
                alt={settings.brandName || 'Logo'}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#168A45] flex items-center justify-center text-white font-black text-lg shadow-sm border border-emerald-600/30">
              {settings?.brandName ? settings.brandName.charAt(0) : 'M'}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-800 text-base tracking-tight">
                {settings?.brandName || 'MYSAR'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] uppercase tracking-wider">
                CRM
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {settings?.companyName || 'Casbiro Solutions Private Limited'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="inline-flex items-center text-[11px] font-bold text-[#0B5D2A] bg-[#EAF7EF] px-3 py-1 rounded-full border border-[#D9E5DD] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#168A45] mr-2 animate-pulse"></span>
            Google Sheets Connected
          </span>
        </div>
      </header>

      {/* Main Login Center Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md space-y-5">
          {/* Card Container */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xl overflow-hidden">
            {/* Header / Brand Banner */}
            <div className="p-6 md:p-8 bg-linear-to-b from-[#EAF7EF]/50 to-white border-b border-gray-100 text-center relative">
              <div className="inline-flex p-3.5 rounded-2xl bg-white border border-emerald-200/90 mb-3 shadow-xs">
                <Lock className="w-6 h-6 text-[#168A45]" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                Sign in to {settings?.brandName || 'MYSAR'}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                Institutional Lead Management & Proposal Engine
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium p-3.5 rounded-xl flex items-start space-x-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {/* Login User ID / Email Input */}
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
                    placeholder="e.g. rafeeh.vk or user@casbiro.com"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full bg-[#F7FAF8] border border-gray-200 text-slate-800 placeholder:text-slate-400 text-xs md:text-sm rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-3 focus:ring-[#168A45]/15 transition-all font-sans"
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
                    className="text-[11px] font-bold text-[#168A45] hover:text-[#0B5D2A] transition-colors"
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
                    className="w-full bg-[#F7FAF8] border border-gray-200 text-slate-800 placeholder:text-slate-400 text-xs md:text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-3 focus:ring-[#168A45]/15 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#168A45] border-gray-300 focus:ring-[#168A45]"
                  />
                  <span className="font-medium">Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#168A45] hover:bg-[#0B5D2A] text-white py-3 px-4 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-800/15 hover:shadow-lg active:scale-98 disabled:opacity-75 disabled:pointer-events-none mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to CRM</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* System Highlights Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/90 backdrop-blur-xs border border-gray-200/80 p-3 rounded-xl shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#168A45] mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-700">RBAC Security</div>
              <div className="text-[9px] text-slate-500 font-medium">Multi-level Roles</div>
            </div>
            <div className="bg-white/90 backdrop-blur-xs border border-gray-200/80 p-3 rounded-xl shadow-2xs">
              <FileSpreadsheet className="w-4 h-4 text-[#168A45] mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-700">Google Sheets</div>
              <div className="text-[9px] text-slate-500 font-medium">Real-time sync</div>
            </div>
            <div className="bg-white/90 backdrop-blur-xs border border-gray-200/80 p-3 rounded-xl shadow-2xs">
              <FileText className="w-4 h-4 text-[#168A45] mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-700">PDF Proposals</div>
              <div className="text-[9px] text-slate-500 font-medium">14-Page Auto Deck</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-gray-200/70 bg-white/50 backdrop-blur-xs">
        <p>
          {settings?.companyName || 'Casbiro Solutions Private Limited'} &copy; {new Date().getFullYear()} &bull;
          All rights reserved &bull; MYSAR Lead Management System v2.4
        </p>
      </footer>

      {/* Forgot Password / Help Dialog */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-150 text-slate-800">
            <div className="bg-slate-50 px-5 py-4 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-[#168A45]" />
                <h3 className="font-bold text-slate-800 text-sm">Account Access & Credentials</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-[#EAF7EF] border border-[#D9E5DD] p-3.5 rounded-xl text-[#0B5D2A] space-y-1">
                <div className="font-bold text-xs flex items-center space-x-1.5 text-[#0B5D2A]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#168A45]" />
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
                  <li>Log in as an <strong>Administrator</strong> (e.g. <code>rafeeh.vk</code>).</li>
                  <li>Navigate to <strong>Settings &rarr; Team & RBAC Manager</strong>.</li>
                  <li>Locate the member row to reveal their password or click <strong>Edit</strong> to update their password.</li>
                  <li>All changes automatically sync to your Google Sheets Users database.</li>
                </ol>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full bg-[#168A45] hover:bg-[#0B5D2A] text-white py-2.5 rounded-xl font-bold transition-all shadow-sm"
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

