import React from 'react';
import {
  Download,
  Key,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobile: () => void;
  onQuickNewInvoice: () => void;
  onQuickNewExpense: () => void;
  onQuickNewPayment: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Business Overview', subtitle: 'Executive dashboard with cash flow & tax metrics' },
  invoices: { title: 'Tax Invoices (Sales)', subtitle: 'Manage outward GST supplies, billings & receivables' },
  quotations: { title: 'Quotations & Estimates', subtitle: 'Manage price quotes, customer estimates & 1-click invoice conversions' },
  purchases: { title: 'Purchase Bills', subtitle: 'Manage supplier bills, inward ITC & inventory entries' },
  customers: { title: 'Customers Master', subtitle: 'Client registry with GSTIN validation & ledger history' },
  suppliers: { title: 'Suppliers Master', subtitle: 'Vendor database with GST verification & payable track' },
  products: { title: 'Products & Inventory', subtitle: 'HSN/SAC catalog, stock management & reorder levels' },
  income: { title: 'Non-Invoice Income', subtitle: 'Record other income streams and direct revenue' },
  expenses: { title: 'Business Expenses', subtitle: 'Operating costs, office expenses & input tax claiming' },
  payments: { title: 'Payment Register', subtitle: 'Customer receipts and vendor disbursements' },
  cashbank: { title: 'Cash & Bank Books', subtitle: 'Liquid accounts, contra transfers & bank reconciliation' },
  creditdebit: { title: 'Credit & Debit Notes', subtitle: 'Sales and purchase returns under GST compliance' },
  recurring: { title: 'Recurring Invoices', subtitle: 'Automate weekly, monthly or yearly subscriptions' },
  gstreports: { title: 'GST Filing Center', subtitle: 'GSTR-1, GSTR-3B summaries and tax liability report' },
  profitloss: { title: 'Profit & Loss Statement', subtitle: 'Financial performance and net margin calculation' },
  reports: { title: 'Financial Reports', subtitle: 'Comprehensive audit, sales and inventory daybooks' },
  users: { title: 'User Roles & Access', subtitle: 'Manage team permissions and access boundaries' },
  audit: { title: 'System Audit Log', subtitle: 'Immutable transaction trails and administrative history' },
  settings: { title: 'Business & Tax Settings', subtitle: 'Company profile, numbering series & database backup' },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobile,
  onQuickNewInvoice,
  onQuickNewExpense,
  onQuickNewPayment,
}) => {
  const {
    state,
    currentUser,
    setCurrentUserId,
    backupData,
    resetToDemo,
    setCredentialsModalOpen,
    logout,
  } = useApp();
  const info = TAB_TITLES[currentTab] || {
    title: state.settings.tradeName || 'mr.farmercorp',
    subtitle: '',
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 shadow-xs no-print">
      {/* Left: Hamburger, Mobile Logo & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <BrandLogo
          variant="icon"
          size="sm"
          logoUrl={state.settings.logoUrl}
          businessName={state.settings.businessName}
          className="lg:hidden shrink-0"
        />

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight flex items-center gap-2 truncate">
            <span className="truncate">{info.title}</span>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              {state.settings.businessName}
            </span>
          </h2>
          <p className="text-xs text-slate-500 hidden md:block">{info.subtitle}</p>
        </div>
      </div>

      {/* Right: Quick actions, Role Switcher, Database Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Action Buttons */}
        <button
          onClick={onQuickNewInvoice}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          title="Create New GST Invoice"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">New Invoice</span>
        </button>

        <button
          onClick={onQuickNewExpense}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition-colors"
          title="Record New Expense"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Expense</span>
        </button>

        <button
          onClick={onQuickNewPayment}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-300 transition-colors"
          title="Record Payment"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Payment</span>
        </button>

        {/* Role Switcher */}
        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 text-xs">
          <Shield className="w-3.5 h-3.5 text-slate-400 ml-1.5 hidden xs:inline" />
          <select
            value={currentUser.id}
            onChange={e => setCurrentUserId(e.target.value)}
            className="bg-transparent text-xs font-medium text-slate-700 px-1.5 sm:px-2 py-1 outline-hidden cursor-pointer max-w-[100px] sm:max-w-none truncate"
            title="Switch User Role to test permissions"
          >
            {state.users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name.split(' ')[0]} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* View Super Admin Credentials */}
        <button
          onClick={() => setCredentialsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
          title="View Super Admin Rooban Username & Password"
        >
          <Key className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden sm:inline">Credentials</span>
        </button>

        {/* Lock / Sign Out */}
        <button
          onClick={logout}
          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
          title="Lock Session / Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Quick Backup & Demo Reset (visible on tablet/desktop) */}
        <button
          onClick={backupData}
          className="hidden sm:inline-flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Download JSON Database Backup"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (confirm('Reset database to default Indian GST demo records? Any unsaved edits will be cleared.')) {
              resetToDemo();
            }
          }}
          className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Reset to Factory Demo Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
