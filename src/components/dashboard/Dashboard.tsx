import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  FileText,
  Filter,
  IndianRupee,
  Layers,
  Percent,
  Plus,
  Printer,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface DashboardProps {
  onOpenInvoiceModal: () => void;
  onOpenExpenseModal: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onNavigateTab: (tab: any) => void;
}

type DateFilterOption = 'today' | 'week' | 'month' | 'fy' | 'custom';

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenInvoiceModal,
  onOpenExpenseModal,
  onViewInvoice,
  onPrintInvoice,
  onNavigateTab,
}) => {
  const { state } = useApp();
  const [filterOption, setFilterOption] = useState<DateFilterOption>('fy');
  const [customStart, setCustomStart] = useState<string>('2026-04-01');
  const [customEnd, setCustomEnd] = useState<string>('2027-03-31');

  // Compute filter dates
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    if (filterOption === 'today') {
      return { startDate: todayStr, endDate: todayStr };
    }
    if (filterOption === 'week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      return { startDate: monday.toISOString().substring(0, 10), endDate: todayStr };
    }
    if (filterOption === 'month') {
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      return { startDate: `${year}-${month}-01`, endDate: todayStr };
    }
    if (filterOption === 'fy') {
      // Current Indian FY starts April 1, 2026
      return { startDate: '2026-04-01', endDate: '2027-03-31' };
    }
    return { startDate: customStart, endDate: customEnd };
  }, [filterOption, customStart, customEnd]);

  // Filtered records
  const isWithinDate = (d?: string) => {
    if (!d) return false;
    return d >= startDate && d <= endDate;
  };

  const filteredInvoices = useMemo(
    () => state.invoices.filter(i => isWithinDate(i.invoiceDate) && i.paymentStatus !== 'Cancelled'),
    [state.invoices, startDate, endDate]
  );

  const filteredPurchases = useMemo(
    () => state.purchases.filter(p => isWithinDate(p.purchaseDate) && p.paymentStatus !== 'Cancelled'),
    [state.purchases, startDate, endDate]
  );

  const filteredExpenses = useMemo(
    () => state.expenses.filter(e => isWithinDate(e.date)),
    [state.expenses, startDate, endDate]
  );

  const filteredIncome = useMemo(
    () => state.income.filter(i => isWithinDate(i.date)),
    [state.income, startDate, endDate]
  );

  // Key Financial Aggregates
  const totalSales = filteredInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPurchases = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalOtherIncome = filteredIncome.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.totalAmount, 0);

  // Output GST (collected on sales)
  const gstCollected = filteredInvoices.reduce(
    (acc, i) => acc + i.cgstTotal + i.sgstTotal + i.igstTotal + i.cessTotal,
    0
  );

  // Input GST (paid on purchases + eligible expenses)
  const gstPaidOnPurchases = filteredPurchases.reduce(
    (acc, p) => acc + p.cgstTotal + p.sgstTotal + p.igstTotal + p.cessTotal,
    0
  );
  const gstPaidOnExpenses = filteredExpenses.reduce((acc, e) => acc + (e.gstAmount || 0), 0);
  const totalGstPaid = gstPaidOnPurchases + gstPaidOnExpenses;
  const netGstPayable = gstCollected - totalGstPaid;

  // Outstanding Receivables and Payables (Current overall)
  const totalCustomerOutstanding = state.customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const totalSupplierOutstanding = state.suppliers.reduce((acc, s) => acc + (s.currentBalance || 0), 0);

  // Net Profit
  // Net Profit = (Total Sales + Total Other Income) - (Total Purchases + Total Expenses)
  const netProfit = totalSales + totalOtherIncome - (totalPurchases + totalExpenses);

  // Liquid Balances
  const cashBalance = state.accounts
    .filter(a => a.type === 'Cash')
    .reduce((acc, a) => acc + a.currentBalance, 0);
  const bankBalance = state.accounts
    .filter(a => a.type === 'Bank' || a.type === 'UPI')
    .reduce((acc, a) => acc + a.currentBalance, 0);

  // Monthly Trend Data for Chart
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const chartData = useMemo(() => {
    return months.map(m => {
      // Mock / actual aggregate by month
      const monthMap: Record<string, string> = {
        Apr: '04',
        May: '05',
        Jun: '06',
        Jul: '07',
        Aug: '08',
        Sep: '09',
        Oct: '10',
        Nov: '11',
        Dec: '12',
        Jan: '01',
        Feb: '02',
        Mar: '03',
      };
      const mm = monthMap[m];
      const sales = state.invoices
        .filter(i => i.invoiceDate.slice(5, 7) === mm && i.paymentStatus !== 'Cancelled')
        .reduce((sum, i) => sum + i.totalAmount, 0);
      const expenses = state.expenses
        .filter(e => e.date.slice(5, 7) === mm)
        .reduce((sum, e) => sum + e.totalAmount, 0);
      return { month: m, sales, expenses };
    });
  }, [state.invoices, state.expenses]);

  const maxVal = Math.max(1, ...chartData.map(d => Math.max(d.sales, d.expenses)));

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Date Scope:</span>
          </div>
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs overflow-x-auto max-w-full">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'fy', label: 'This FY (2026-27)' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilterOption(opt.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  filterOption === opt.id
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filterOption === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-700"
            />
          </div>
        )}

        <div className="text-xs text-slate-500 font-medium">
          Showing data: <span className="font-semibold text-slate-800">{startDate}</span> to{' '}
          <span className="font-semibold text-slate-800">{endDate}</span>
        </div>
      </div>

      {/* Row 1: Primary Revenue & Cash Flow Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 font-mono">{formatINR(totalSales)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {filteredInvoices.length} invoices generated
            </div>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Purchases</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 font-mono">{formatINR(totalPurchases)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {filteredPurchases.length} supplier bills received
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-900 font-mono">{formatINR(totalExpenses)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {filteredExpenses.length} operational expense items
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Net Profit</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                netProfit >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-xl font-bold font-mono ${
                netProfit >= 0 ? 'text-indigo-700' : 'text-rose-600'
              }`}
            >
              {formatINR(netProfit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Revenue - Costs & Expenses</div>
          </div>
        </div>
      </div>

      {/* Row 2: Indian GST & Liquid Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Output GST (Collected) */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">GST Collected (Output)</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-emerald-400">
              Tax On Sales
            </span>
          </div>
          <div className="mt-3 text-lg font-bold font-mono text-emerald-400">{formatINR(gstCollected)}</div>
          <div className="text-[11px] text-slate-400 mt-1">CGST + SGST + IGST liability</div>
        </div>

        {/* Input GST (Paid/ITC) */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">GST Paid (Input Tax Credit)</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-sky-400">
              ITC Available
            </span>
          </div>
          <div className="mt-3 text-lg font-bold font-mono text-sky-400">{formatINR(totalGstPaid)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Purchases & business inputs</div>
        </div>

        {/* Net GST Payable */}
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Net GST Payable</span>
            <span
              className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm ${
                netGstPayable > 0 ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'
              }`}
            >
              {netGstPayable > 0 ? 'Payable' : 'Credit Carry'}
            </span>
          </div>
          <div className="mt-3 text-lg font-bold font-mono text-white">
            {formatINR(Math.abs(netGstPayable))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {netGstPayable > 0 ? 'Output GST exceeds ITC' : 'Excess input tax credit carryover'}
          </div>
        </div>

        {/* Liquid Balances (Bank + Cash) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Liquid Funds</span>
            <Wallet className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Bank & UPI:</span>
              <span className="font-mono font-semibold text-slate-800">{formatINR(bankBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Cash in Hand:</span>
              <span className="font-mono font-semibold text-slate-800">{formatINR(cashBalance)}</span>
            </div>
            <div className="border-t border-slate-100 pt-1 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Total Liquid:</span>
              <span className="font-mono text-indigo-700">{formatINR(bankBalance + cashBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Outstanding Receivables & Payables Alert Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Receivables */}
        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-emerald-800 uppercase tracking-wide">
              Customer Outstanding (Receivable)
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950 mt-1">
              {formatINR(totalCustomerOutstanding)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Pending dues across {state.customers.filter(c => c.currentBalance > 0).length} client accounts
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('customers')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            View Debtors
          </button>
        </div>

        {/* Supplier Payables */}
        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-amber-800 uppercase tracking-wide">
              Supplier Outstanding (Payable)
            </div>
            <div className="text-2xl font-bold font-mono text-amber-950 mt-1">
              {formatINR(totalSupplierOutstanding)}
            </div>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Vendor bills due across {state.suppliers.filter(s => s.currentBalance > 0).length} suppliers
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('suppliers')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            View Creditors
          </button>
        </div>
      </div>

      {/* Row 4: Monthly Sales & Expense Interactive Visual Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">FY 2026-27 Revenue vs Operating Cost Trend</h3>
            <p className="text-xs text-slate-500">Monthly billing vs expense distribution</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-indigo-600" />
              <span className="text-slate-600">Sales Invoices</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              <span className="text-slate-600">Expenses</span>
            </div>
          </div>
        </div>

        {/* Chart SVG Canvas */}
        <div className="mt-4 pt-4 overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 h-44 items-end px-2 min-w-[520px]">
            {chartData.map((d, idx) => {
              const salesHeight = Math.max(6, Math.round((d.sales / maxVal) * 140));
              const expHeight = Math.max(6, Math.round((d.expenses / maxVal) * 140));

              return (
                <div key={idx} className="flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <div>Sales: {formatINR(d.sales)}</div>
                    <div>Exp: {formatINR(d.expenses)}</div>
                  </div>

                  <div className="flex items-end gap-1 w-full justify-center">
                    <div
                      style={{ height: `${salesHeight}px` }}
                      className="w-3 sm:w-4 bg-emerald-600 rounded-t-xs hover:bg-emerald-500 transition-all cursor-pointer"
                    />
                    <div
                      style={{ height: `${expHeight}px` }}
                      className="w-3 sm:w-4 bg-amber-500 rounded-t-xs hover:bg-amber-400 transition-all cursor-pointer"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-1">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 5: Recent Invoices & Recent Expenses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent GST Invoices</h3>
              <p className="text-xs text-slate-500">Latest outward supplies generated</p>
            </div>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All ({state.invoices.length})
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Invoice #</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 truncate max-w-[160px]">
                        {inv.customerName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.paymentStatus === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.paymentStatus === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-sm"
                          title="View Invoice Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onPrintInvoice(inv)}
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-sm"
                          title="Print / PDF Format"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Expenses & Recent Income (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Expenses</h3>
              <p className="text-xs text-slate-500">Office & operational payments</p>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All
            </button>
          </div>

          <div className="p-3 divide-y divide-slate-100 flex-1 overflow-y-auto">
            {state.expenses.slice(0, 5).map(exp => (
              <div key={exp.id} className="py-2.5 first:pt-0 flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-800">{exp.description}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-slate-600">{exp.category}</span>
                    <span>•</span>
                    <span className="font-mono">{exp.date}</span>
                  </div>
                </div>
                <div className="text-right font-mono font-semibold text-rose-600 text-xs">
                  -{formatINR(exp.totalAmount)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100">
            <button
              onClick={onOpenExpenseModal}
              className="w-full py-1.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Expense</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
