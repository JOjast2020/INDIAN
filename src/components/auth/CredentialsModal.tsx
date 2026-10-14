import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Lock,
  Save,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const CredentialsModal: React.FC = () => {
  const {
    state,
    credentialsModalOpen,
    setCredentialsModalOpen,
    saveUser,
    showToast,
  } = useApp();

  const superAdmin =
    state.users.find(u => u.name.toLowerCase().includes('rooban') || u.role === 'Super Admin') ||
    state.users[0];

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(superAdmin?.username || 'rooban');
  const [newPassword, setNewPassword] = useState(superAdmin?.password || 'Rooban@123');

  if (!credentialsModalOpen || !superAdmin) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showToast('Username and password cannot be empty.', 'error');
      return;
    }

    saveUser({
      ...superAdmin,
      username: newUsername.trim(),
      password: newPassword.trim(),
    });

    setIsEditing(false);
    showToast('Super Admin credentials updated successfully!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo
              variant="icon"
              size="sm"
              logoUrl={state.settings.logoUrl}
              businessName={state.settings.businessName}
              className="shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Super Admin Credentials</h3>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                  Primary
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-mono mt-0.5">
                {state.settings.tradeName || 'mr.farmercorp'} System Access
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCredentialsModalOpen(false);
              setIsEditing(false);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Sole Super Admin: Rooban</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Multiple admins have been purged. Only <strong>Rooban</strong> holds full administrator
                clearance for mr.farmercorp.
              </p>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              {/* Administrator Name */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Administrator Name
                  </span>
                  <span className="text-sm font-bold text-slate-900">{superAdmin.name}</span>
                </div>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-bold font-mono">
                  {superAdmin.role}
                </span>
              </div>

              {/* Username Field */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Username / Login ID
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {superAdmin.username || 'rooban'}
                  </span>
                  <span className="text-[11px] text-slate-400 block font-mono truncate">
                    Email: {superAdmin.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(superAdmin.username || 'rooban', 'Username')}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                >
                  {copiedField === 'Username' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Password Field */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                    Password
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {showPassword ? superAdmin.password || 'Rooban@123' : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-700 p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(superAdmin.password || 'Rooban@123', 'Password')}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                >
                  {copiedField === 'Password' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Company Info Box */}
              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-100 grid grid-cols-2 gap-2 font-mono">
                <div>
                  <span className="text-slate-400 block">Mobile:</span>
                  <span className="font-semibold text-slate-700">{state.settings.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">GSTIN:</span>
                  <span className="font-semibold text-slate-700">{state.settings.gstin}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewUsername(superAdmin.username || 'rooban');
                    setNewPassword(superAdmin.password || 'Rooban@123');
                    setIsEditing(true);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Change Password / Username
                </button>
                <button
                  type="button"
                  onClick={() => setCredentialsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Super Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  placeholder="rooban"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono"
                  placeholder="Rooban@123"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save New Credentials</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
