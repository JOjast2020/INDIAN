import React from 'react';
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  FileStack,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  Package,
  PiggyBank,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';

export type NavTab =
  | 'dashboard'
  | 'invoices'
  | 'quotations'
  | 'purchases'
  | 'customers'
  | 'suppliers'
  | 'products'
  | 'income'
  | 'expenses'
  | 'payments'
  | 'cashbank'
  | 'creditdebit'
  | 'recurring'
  | 'gstreports'
  | 'profitloss'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isOpen, onCloseMobile }) => {
  const { state, currentUser } = useApp();

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string; roleAllowed?: string[] }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Sales Invoices', icon: FileText, badge: `${state.invoices.length}` },
    { id: 'quotations', label: 'Quotations / Estimates', icon: ClipboardList, badge: `${(state.quotations || []).length}` },
    { id: 'purchases', label: 'Purchase Bills', icon: ShoppingCart, badge: `${state.purchases.length}` },
    { id: 'customers', label: 'Customers', icon: Users, badge: `${state.customers.length}` },
    { id: 'suppliers', label: 'Suppliers', icon: Building2, badge: `${state.suppliers.length}` },
    { id: 'products', label: 'Products & Stock', icon: Package, badge: `${state.products.length}` },
    { id: 'income', label: 'Other Income', icon: CircleDollarSign },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'cashbank', label: 'Cash & Bank', icon: PiggyBank },
    { id: 'creditdebit', label: 'Credit/Debit Notes', icon: Scale },
    { id: 'recurring', label: 'Recurring Invoices', icon: CalendarClock },
    { id: 'gstreports', label: 'GST Filing Reports', icon: FileCheck2 },
    { id: 'profitloss', label: 'Profit & Loss', icon: BarChart3 },
    { id: 'reports', label: 'Reports Center', icon: FileSpreadsheet },
    { id: 'users', label: 'Users & Roles', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Role permissions check
  const filteredNavItems = navItems.filter(item => {
    if (currentUser.role === 'Staff') {
      return ['dashboard', 'invoices', 'quotations', 'customers', 'products', 'expenses'].includes(item.id);
    }
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo
              variant="icon"
              size="sm"
              logoUrl={state.settings.logoUrl}
              businessName={state.settings.businessName}
              className="shrink-0"
            />
            <div className="min-w-0 truncate">
              <h1
                className="text-sm font-serif font-black tracking-tight text-white leading-tight truncate"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                {state.settings.businessName}
              </h1>
              <p className="text-[10px] text-amber-400 font-mono font-medium truncate">
                {state.settings.tradeName || 'GST Billing ERP'}
              </p>
            </div>
          </div>
        </div>

        {/* Business summary card in sidebar */}
        <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-800 text-xs">
          <div className="text-slate-300 font-semibold truncate">{state.settings.businessName}</div>
          <div className="flex items-center justify-between text-[11px] mt-1 text-slate-400 font-mono">
            <span>GST: {state.settings.gstin.slice(0, 7)}...</span>
            <span className="text-emerald-400 font-medium">TN (33)</span>
          </div>
        </div>

        {/* Nav Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Footnote */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-slate-300 text-[11px]">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-white font-medium truncate text-xs">{currentUser.name}</div>
              <div className="text-[10px] text-emerald-400 font-mono">{currentUser.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
