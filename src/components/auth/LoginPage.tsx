import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  Lock,
  Phone,
  Shield,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const LoginPage: React.FC = () => {
  const { state, login } = useApp();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const superAdmin =
    state.users.find(u => u.name.toLowerCase().includes('rooban') || u.role === 'Super Admin') ||
    state.users[0];

  const adminUsername = superAdmin?.username || 'rooban';
  const adminPassword = superAdmin?.password || 'Rooban@123';

  const handleQuickLogin = () => {
    setUsernameOrEmail(adminUsername);
    setPassword(adminPassword);
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      login(adminUsername, adminPassword);
      setIsLoading(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(usernameOrEmail, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid username or password.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Crest & Heading */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-xs">
            <BrandLogo
              variant="icon"
              size="xl"
              logoUrl={state.settings.logoUrl}
              businessName={state.settings.businessName}
            />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {state.settings.tradeName || 'mr.farmercorp'}
            </h1>
            <p className="text-xs sm:text-sm text-amber-400 font-mono tracking-wide mt-1">
              Agricultural Solutions & GST Billing ERP
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Super Admin Notice Banner */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-950 block">Super Admin Access Portal</span>
                <p className="text-amber-900/90 text-[11px] mt-0.5">
                  Single Super Admin: <strong>Rooban</strong> (all other admin privileges removed).
                </p>
                <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono text-[11px] text-amber-950 bg-amber-100/70 px-2 py-1 rounded-md">
                    User: <strong>{adminUsername}</strong> &nbsp;|&nbsp; Pass: <strong>{adminPassword}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickLogin}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-[11px] font-bold rounded-md shadow-xs transition-colors shrink-0"
                  >
                    Quick Sign In as Rooban
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. rooban or admin@mr.farmercorp.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-900 hover:from-slate-800 hover:to-amber-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as Super Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer details in card */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>GSTIN: {state.settings.gstin}</span>
            <span>Mob: {state.settings.phone}</span>
          </div>
        </div>

        {/* Corporate Legal & Support Details */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">
            {state.settings.businessName} &bull; Pollachi Main Road, Coimbatore, Tamil Nadu
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            Support: {state.settings.email} &bull; +91 {state.settings.phone}
          </p>
        </div>
      </div>
    </div>
  );
};
