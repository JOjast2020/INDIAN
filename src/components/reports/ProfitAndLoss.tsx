import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  Filter,
  IndianRupee,
  Printer,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/indianGST';

export const ProfitAndLoss: React.FC = () => {
  const { state, showToast } = useApp();
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2027-03-31');

  const isWithin = (d?: string) => !!d && d >= startDate && d <= endDate;

  // Revenue Streams
  const validInvoices = useMemo(
    () => state.invoices.filter(i => isWithin(i.invoiceDate) && i.paymentStatus !== 'Cancelled'),
    [state.invoices, startDate, endDate]
  );
  const validIncome = useMemo(
    () => state.income.filter(i => isWithin(i.date)),
    [state.income, startDate, endDate]
  );

  // Cost of Goods Sold / Direct Purchases
  const validPurchases = useMemo(
    () => state.purchases.filter(p => isWithin(p.purchaseDate) && p.paymentStatus !== 'Cancelled'),
    [state.purchases, startDate, endDate]
  );

  // Operating Expenses
  const validExpenses = useMemo(
    () => state.expenses.filter(e => isWithin(e.date)),
    [state.expenses, startDate, endDate]
  );

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    validExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [validExpenses]);

  // Aggregates (Base taxable revenue and base costs, without pass-through GST)
  const salesRevenue = validInvoices.reduce((sum, i) => sum + i.taxableAmount, 0);
  const otherIncome = validIncome.reduce((sum, i) => sum + i.amount, 0);
  const totalRevenue = salesRevenue + otherIncome;

  const costOfGoodsSold = validPurchases.reduce((sum, p) => sum + p.taxableAmount, 0);
  const grossProfit = totalRevenue - costOfGoodsSold;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const totalOperatingExpenses = Object.values(expensesByCategory).reduce((sum, v) => sum + v, 0);
  const netProfit = grossProfit - totalOperatingExpenses;
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const handleExportCSV = () => {
    const rows = [
      ['PROFIT & LOSS STATEMENT', 'AMOUNT (INR)'],
      ['Reporting Scope', `${startDate} to ${endDate}`],
      [''],
      ['REVENUE', ''],
      ['Gross Taxable Sales Turnover', salesRevenue],
      ['Other Business Income', otherIncome],
      ['TOTAL REVENUE (A)', totalRevenue],
      [''],
      ['COST OF GOODS SOLD (COGS)', ''],
      ['Inward Purchases of Stock / Raw Material', costOfGoodsSold],
      ['TOTAL COST OF GOODS SOLD (B)', costOfGoodsSold],
      [''],
      ['GROSS PROFIT (C = A - B)', grossProfit],
      ['Gross Profit Margin (%)', `${grossMarginPct.toFixed(2)}%`],
      [''],
      ['OPERATING EXPENSES (D)', ''],
      ...Object.entries(expensesByCategory).map(([cat, val]) => [cat, val]),
      ['TOTAL OPERATING EXPENSES (D)', totalOperatingExpenses],
      [''],
      ['NET PROFIT BEFORE TAX (E = C - D)', netProfit],
      ['Net Profit Margin (%)', `${netMarginPct.toFixed(2)}%`],
    ];

    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Profit_Loss_Statement_${state.settings.financialYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Profit & Loss statement exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Date filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Financial Period:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white font-mono text-slate-800"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 bg-white font-mono text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print P&L</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Gross Revenue (Excl. GST)</span>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">{formatINR(totalRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sales + Direct Consultation & Interest</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-blue-600">Gross Margin</span>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-700">{formatINR(grossProfit)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Margin: {grossMarginPct.toFixed(1)}% of Revenue
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-indigo-600">Net Profit</span>
          <div
            className={`mt-1 text-2xl font-bold font-mono ${
              netProfit >= 0 ? 'text-indigo-700' : 'text-rose-600'
            }`}
          >
            {formatINR(netProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Net Margin: {netMarginPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto text-xs font-mono">
        <div className="text-center pb-4 border-b-2 border-slate-900">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">
            {state.settings.businessName}
          </h2>
          <h3 className="text-sm font-semibold text-slate-700 mt-0.5">STATEMENT OF PROFIT & LOSS</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
            For the period from {startDate} to {endDate} (FY {state.settings.financialYear})
          </p>
        </div>

        <div className="py-4 space-y-4">
          {/* Section 1: Revenue */}
          <div>
            <div className="bg-slate-100 p-2 font-bold text-slate-900 font-sans uppercase text-[11px]">
              I. REVENUE FROM OPERATIONS
            </div>
            <div className="divide-y divide-slate-100 mt-1">
              <div className="flex justify-between py-1.5 px-3 text-slate-800">
                <span>Taxable Invoiced Sales Turnover</span>
                <span>{formatINR(salesRevenue)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-3 text-slate-800">
                <span>Other Non-Invoice Direct Income</span>
                <span>{formatINR(otherIncome)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 font-bold text-slate-900 bg-slate-50 border-t border-slate-300">
                <span>TOTAL REVENUE (I)</span>
                <span>{formatINR(totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Cost of Sales */}
          <div>
            <div className="bg-slate-100 p-2 font-bold text-slate-900 font-sans uppercase text-[11px]">
              II. COST OF GOODS SOLD / DIRECT PURCHASES
            </div>
            <div className="divide-y divide-slate-100 mt-1">
              <div className="flex justify-between py-1.5 px-3 text-slate-800">
                <span>Direct Inward Purchases of Goods / Inventory</span>
                <span>{formatINR(costOfGoodsSold)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 font-bold text-slate-900 bg-slate-50 border-t border-slate-300">
                <span>TOTAL COST OF GOODS SOLD (II)</span>
                <span>{formatINR(costOfGoodsSold)}</span>
              </div>
            </div>
          </div>

          {/* Gross Profit Callout */}
          <div className="flex justify-between p-3 font-bold text-blue-900 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <span>GROSS PROFIT (I - II)</span>
            <span>{formatINR(grossProfit)}</span>
          </div>

          {/* Section 3: Operating Expenses */}
          <div>
            <div className="bg-slate-100 p-2 font-bold text-slate-900 font-sans uppercase text-[11px]">
              III. OPERATING & ADMINISTRATIVE EXPENSES
            </div>
            <div className="divide-y divide-slate-100 mt-1">
              {Object.keys(expensesByCategory).length === 0 ? (
                <div className="py-2 px-3 text-slate-400 italic">No operating expenses in this period.</div>
              ) : (
                Object.entries(expensesByCategory).map(([cat, val]) => (
                  <div key={cat} className="flex justify-between py-1.5 px-3 text-slate-800">
                    <span>{cat}</span>
                    <span>{formatINR(val)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between py-2 px-3 font-bold text-slate-900 bg-slate-50 border-t border-slate-300">
                <span>TOTAL OPERATING EXPENSES (III)</span>
                <span>{formatINR(totalOperatingExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit Callout */}
          <div
            className={`flex justify-between p-4 font-bold rounded-xl border text-base ${
              netProfit >= 0
                ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                : 'bg-rose-50 text-rose-950 border-rose-300'
            }`}
          >
            <span>NET PROFIT / (LOSS) FOR THE PERIOD</span>
            <span className="font-extrabold">{formatINR(netProfit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
