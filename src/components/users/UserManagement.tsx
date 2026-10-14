import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

export const UserManagement: React.FC = () => {
  const { state, currentUser, setCurrentUserId, saveUser, showToast, setCredentialsModalOpen } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Accountant');
  const [phone, setPhone] = useState('');

  const [showAdminPass, setShowAdminPass] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const superAdmin =
    state.users.find(u => u.name.toLowerCase().includes('rooban') || u.role === 'Super Admin') ||
    state.users[0];

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(label);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (role === 'Super Admin' && !name.toLowerCase().includes('rooban')) {
      showToast('Multiple Super Admins are restricted. Only Rooban is authorized as Super Admin.', 'error');
      return;
    }

    const newUser: User = {
      id: `USR-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      username: username.trim() || email.split('@')[0],
      password: password.trim() || 'Staff@123',
      role,
      phone: phone.trim(),
      active: true,
      lastLogin: 'Never',
    };

    saveUser(newUser);
    setShowModal(false);
    setName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setPhone('');
    setRole('Accountant');
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Credentials Showcase Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Super Admin: {superAdmin.name}
              </h3>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                Sole Super Admin
              </span>
            </div>
            <p className="text-xs text-amber-200/80">
              Company: <strong>{state.settings.tradeName || 'mr.farmercorp'}</strong> &bull; Multiple admins removed per corporate security policy.
            </p>
          </div>

          <button
            onClick={() => setCredentialsModalOpen(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all self-start md:self-auto shrink-0"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Manage Admin Credentials</span>
          </button>
        </div>

        {/* Credentials Bar */}
        <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Username
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono font-bold text-white text-sm">
                {superAdmin.username || 'rooban'}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(superAdmin.username || 'rooban', 'Username')}
                className="text-slate-400 hover:text-amber-400 p-1"
                title="Copy username"
              >
                {copiedKey === 'Username' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Password
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono font-bold text-white text-sm">
                {showAdminPass ? superAdmin.password || 'Rooban@123' : '••••••••••••'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="text-slate-400 hover:text-white p-1"
                  title={showAdminPass ? 'Hide password' : 'Show password'}
                >
                  {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(superAdmin.password || 'Rooban@123', 'Password')}
                  className="text-slate-400 hover:text-amber-400 p-1"
                  title="Copy password"
                >
                  {copiedKey === 'Password' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Official Email
            </span>
            <span className="font-mono font-medium text-slate-200 mt-1 block truncate">
              {superAdmin.email}
            </span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Direct Phone
            </span>
            <span className="font-mono font-medium text-slate-200 mt-1 block">
              {superAdmin.phone || state.settings.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Role-Based Access Control (RBAC)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Current active session: <strong className="text-slate-900">{currentUser.name}</strong> (
            <span className="text-emerald-700 font-semibold">{currentUser.role}</span>)
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Team Member (Staff / Accountant)</span>
        </button>
      </div>

      {/* System Users List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {state.users.map(u => {
          const isCurrent = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`p-5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full ${
                    u.role === 'Super Admin'
                      ? 'bg-rose-100 text-rose-800'
                      : u.role === 'Accountant'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {u.role}
                </span>

                {isCurrent ? (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Active Session
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentUserId(u.id)}
                    className="text-[11px] text-slate-600 hover:text-emerald-700 font-semibold underline"
                  >
                    Switch to this role
                  </button>
                )}
              </div>

              <div className="mt-3">
                <h4 className="font-bold text-slate-900 text-sm">{u.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                {u.username && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    User ID: {u.username}
                  </p>
                )}
                {u.phone && <p className="text-[11px] font-mono text-slate-400 mt-0.5">{u.phone}</p>}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div>
                  <strong>Permissions: </strong>
                  {u.role === 'Super Admin'
                    ? 'Unrestricted authority across all billing modules, tax settings & audit trails'
                    : u.role === 'Accountant'
                    ? 'Invoices, Purchases, Expenses, Payments, GST & P&L statements'
                    : 'Limited to Customer entry, Products catalog & Sales Invoices'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Enterprise Permissions Matrix
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
              <tr>
                <th className="p-3">Module Capability</th>
                <th className="p-3 text-center">Super Admin (Rooban)</th>
                <th className="p-3 text-center">Accountant</th>
                <th className="p-3 text-center">Staff Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { mod: 'Sales Invoices & Billing', sa: true, acc: true, st: true },
                { mod: 'Customer Registry', sa: true, acc: true, st: true },
                { mod: 'Products & Inventory Catalog', sa: true, acc: true, st: true },
                { mod: 'Purchase Bills & Supplier Creditors', sa: true, acc: true, st: false },
                { mod: 'Operating Expenses & ITC Claims', sa: true, acc: true, st: false },
                { mod: 'Payment Receipts & Disbursements', sa: true, acc: true, st: false },
                { mod: 'Cash & Bank Books / Contra Transfers', sa: true, acc: true, st: false },
                { mod: 'GST Reports (GSTR-1, GSTR-3B)', sa: true, acc: true, st: false },
                { mod: 'Profit & Loss Financial Statement', sa: true, acc: true, st: false },
                { mod: 'Cancel / Void Invoices with Audit Trail', sa: true, acc: true, st: false },
                { mod: 'Company Profile, Tax & Series Settings', sa: true, acc: false, st: false },
                { mod: 'Database Backup & System Reset', sa: true, acc: false, st: false },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 font-medium text-slate-800">{row.mod}</td>
                  <td className="p-3 text-center">
                    <span className="text-emerald-600 font-bold">✓ Full</span>
                  </td>
                  <td className="p-3 text-center">
                    {row.acc ? (
                      <span className="text-emerald-600 font-bold">✓ Allowed</span>
                    ) : (
                      <span className="text-slate-300">✕</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.st ? (
                      <span className="text-emerald-600 font-bold">✓ Allowed</span>
                    ) : (
                      <span className="text-slate-300">✕</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Add New Team Member</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
              Note: Multiple Super Admins are restricted. Only <strong>Rooban</strong> holds Super Admin
              clearance for mr.farmercorp. Team members can be assigned as Accountant or Staff.
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@mr.farmercorp.in"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. anand"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="e.g. Staff@123"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="6380323254"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  <option value="Accountant">Accountant (Accounting & Reports)</option>
                  <option value="Staff">Staff (Invoicing & Products)</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Add Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
