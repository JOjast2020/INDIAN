import React, { useMemo, useState } from 'react';
import {
  CircleDollarSign,
  Download,
  Edit2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Income } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface IncomeListProps {
  onOpenCreateModal: () => void;
  onEditIncome: (inc: Income) => void;
}

export const IncomeList: React.FC<IncomeListProps> = ({
  onOpenCreateModal,
  onEditIncome,
}) => {
  const { state, deleteIncome, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    state.income.forEach(i => set.add(i.category));
    return Array.from(set);
  }, [state.income]);

  const filteredIncome = useMemo(() => {
    return state.income.filter(i => {
      const matchSearch =
        i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.incomeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.source.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === 'all' || i.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [state.income, searchTerm, categoryFilter]);

  const totalIncomeVal = filteredIncome.reduce((sum, i) => sum + i.totalAmount, 0);

  const handleExportCSV = () => {
    if (filteredIncome.length === 0) {
      showToast('No income records to export', 'info');
      return;
    }
    const headers = [
      'Income #',
      'Date',
      'Category',
      'Source / Client',
      'Description',
      'Amount',
      'GST Tax',
      'Total Amount',
      'Payment Method',
      'Reference #',
    ];
    const rows = filteredIncome.map(i => [
      `"${i.incomeNumber}"`,
      `"${i.date}"`,
      `"${i.category}"`,
      `"${i.source}"`,
      `"${i.description}"`,
      i.amount,
      i.gstAmount,
      i.totalAmount,
      `"${i.paymentMethod}"`,
      `"${i.referenceNumber || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Other_Income_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Income exported successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Non-Invoice Income</span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-700">
            {formatINR(totalIncomeVal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredIncome.length} revenue entries</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Distinct Categories</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{categories.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Advisory, Interest, Commission, Rental</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search description, source, income #..."
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Income</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Income #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Source & Description</th>
                <th className="px-4 py-3">Mode & Account</th>
                <th className="px-4 py-3 text-right">Base Amount</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncome.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No income entries found.
                  </td>
                </tr>
              ) : (
                filteredIncome.map(inc => {
                  const account = state.accounts.find(a => a.id === inc.accountId);

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{inc.incomeNumber}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{inc.date}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{inc.category}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{inc.description}</div>
                        {inc.source && (
                          <div className="text-[11px] text-slate-500">Source: {inc.source}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        <div className="text-slate-800">{account?.name.split('(')[0] || 'Liquid A/C'}</div>
                        <div className="text-slate-500">{inc.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatINR(inc.amount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 font-medium">
                        {inc.gstAmount > 0 ? formatINR(inc.gstAmount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                        {formatINR(inc.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditIncome(inc)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete income ${inc.incomeNumber}?`)) {
                                deleteIncome(inc.id);
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
    </div>
  );
};
