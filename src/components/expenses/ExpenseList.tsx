import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit2,
  Paperclip,
  Plus,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface ExpenseListProps {
  onOpenCreateModal: () => void;
  onEditExpense: (exp: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  onOpenCreateModal,
  onEditExpense,
}) => {
  const { state, deleteExpense, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewAttachment, setViewAttachment] = useState<{ name: string; data?: string } | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    state.expenses.forEach(e => set.add(e.category));
    return Array.from(set);
  }, [state.expenses]);

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter(e => {
      const matchSearch =
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [state.expenses, searchTerm, categoryFilter]);

  const totalExpenseVal = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalGstITC = filteredExpenses.reduce((sum, e) => sum + (e.gstAmount || 0), 0);

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('No expenses to export', 'info');
      return;
    }
    const headers = [
      'Expense #',
      'Date',
      'Category',
      'Vendor',
      'Description',
      'Base Amount',
      'GST Tax',
      'Total Amount',
      'Payment Method',
      'Reference #',
    ];
    const rows = filteredExpenses.map(e => [
      `"${e.expenseNumber}"`,
      `"${e.date}"`,
      `"${e.category}"`,
      `"${e.vendor}"`,
      `"${e.description}"`,
      e.amount,
      e.gstAmount,
      e.totalAmount,
      `"${e.paymentMethod}"`,
      `"${e.referenceNumber || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Business_Expenses_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Expenses exported successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Operating Expenses</span>
          <div className="mt-1 text-xl font-bold font-mono text-rose-600">{formatINR(totalExpenseVal)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredExpenses.length} expense items</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-sky-600">GST Input Tax Credit (ITC)</span>
          <div className="mt-1 text-xl font-bold font-mono text-sky-700">{formatINR(totalGstITC)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Claimable against output liability</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Categories Monitored</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{categories.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Rent, Utilities, Internet, Logistics</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search description, payee vendor, expense #..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden max-w-[160px] truncate"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Expense #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Vendor & Description</th>
                <th className="px-4 py-3">Account & Method</th>
                <th className="px-4 py-3 text-right">Base Amount</th>
                <th className="px-4 py-3 text-right">GST (ITC)</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => {
                  const account = state.accounts.find(a => a.id === exp.accountId);

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {exp.expenseNumber}
                        {exp.attachmentName && (
                          <button
                            onClick={() =>
                              setViewAttachment({ name: exp.attachmentName!, data: exp.attachmentData })
                            }
                            className="inline-flex items-center ml-1 text-indigo-600 hover:text-indigo-800"
                            title="View Receipt Attachment"
                          >
                            <Paperclip className="w-3 h-3" />
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{exp.date}</td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{exp.category}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{exp.description}</div>
                        {exp.vendor && (
                          <div className="text-[11px] text-slate-500">Payee: {exp.vendor}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[11px]">
                        <div className="text-slate-800">{account?.name.split('(')[0] || 'Cash/Bank'}</div>
                        <div className="text-slate-500">{exp.paymentMethod}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatINR(exp.amount)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-sky-700 font-medium">
                        {exp.gstAmount > 0 ? formatINR(exp.gstAmount) : '-'}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                        {formatINR(exp.totalAmount)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditExpense(exp)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete expense ${exp.expenseNumber}?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">Receipt: {viewAttachment.name}</span>
              <button onClick={() => setViewAttachment(null)} className="p-1 text-slate-400">
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center p-4 bg-slate-100 rounded-lg max-h-96 overflow-auto">
              {viewAttachment.data ? (
                <img
                  src={viewAttachment.data}
                  alt="Receipt"
                  className="max-h-80 object-contain rounded-sm"
                />
              ) : (
                <div className="text-xs text-slate-500 font-mono">Receipt file: {viewAttachment.name}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
