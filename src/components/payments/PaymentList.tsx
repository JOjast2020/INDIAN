import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, PaymentRecord } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface PaymentListProps {
  onOpenCreateModal: (type?: 'Customer Payment' | 'Supplier Payment') => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({ onOpenCreateModal }) => {
  const { state, showToast, deletePayment, savePayment } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteModalPayment, setDeleteModalPayment] = useState<PaymentRecord | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  // Edit form state
  const [editDate, setEditDate] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMethod, setEditMethod] = useState<PaymentMethod>('Bank Transfer');
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [editRef, setEditRef] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const handleStartEdit = (p: PaymentRecord) => {
    setEditingPayment(p);
    setEditDate(p.date);
    setEditAmount(p.amount);
    setEditMethod(p.paymentMethod);
    setEditAccountId(p.accountId);
    setEditRef(p.referenceNumber || '');
    setEditNotes(p.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    if (editAmount <= 0) {
      showToast('Amount must be greater than zero', 'error');
      return;
    }

    const updated: PaymentRecord = {
      ...editingPayment,
      date: editDate,
      amount: editAmount,
      paymentMethod: editMethod,
      accountId: editAccountId,
      referenceNumber: editRef.trim(),
      notes: editNotes.trim(),
    };

    savePayment(updated);
    setEditingPayment(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalPayment) return;
    deletePayment(deleteModalPayment.id);
    setDeleteModalPayment(null);
  };

  const filteredPayments = useMemo(() => {
    return state.payments.filter(p => {
      const matchSearch =
        p.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.invoiceOrBillNumber && p.invoiceOrBillNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'all' || p.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [state.payments, searchTerm, typeFilter]);

  const totalReceipts = filteredPayments
    .filter(p => p.type === 'Customer Payment')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDisbursements = filteredPayments
    .filter(p => p.type === 'Supplier Payment')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      showToast('No payment records to export', 'info');
      return;
    }
    const headers = [
      'Payment #',
      'Date',
      'Nature',
      'Entity Name',
      'Linked Invoice/Bill #',
      'Method',
      'Reference / UTR',
      'Amount (₹)',
      'Account',
    ];
    const rows = filteredPayments.map(p => {
      const acc = state.accounts.find(a => a.id === p.accountId);
      return [
        `"${p.paymentNumber}"`,
        `"${p.date}"`,
        `"${p.type}"`,
        `"${p.entityName}"`,
        `"${p.invoiceOrBillNumber || ''}"`,
        `"${p.paymentMethod}"`,
        `"${p.referenceNumber || ''}"`,
        p.amount,
        `"${acc?.name || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Payments_Register_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Payment register exported.');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Customer Receipts (Inflow)</span>
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-700">
            {formatINR(totalReceipts)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Collections credited to accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Supplier Payments (Outflow)</span>
          </span>
          <div className="mt-1 text-xl font-bold font-mono text-amber-700">
            {formatINR(totalDisbursements)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Disbursements cleared to vendors</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Transactions</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{filteredPayments.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Recorded payment vouchers</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search voucher #, customer, supplier, reference UTR..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden"
          >
            <option value="all">All Nature</option>
            <option value="Customer Payment">Customer Receipts</option>
            <option value="Supplier Payment">Supplier Disbursements</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => onOpenCreateModal('Customer Payment')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Receive Payment</span>
          </button>

          <button
            onClick={() => onOpenCreateModal('Supplier Payment')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pay Supplier</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Receipt / Voucher #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Nature</th>
                <th className="px-4 py-3">Party (Customer / Supplier)</th>
                <th className="px-4 py-3">Linked Invoice / Bill</th>
                <th className="px-4 py-3">Payment Method & Ref</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No payment vouchers found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const account = state.accounts.find(a => a.id === p.accountId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{p.date}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.type === 'Customer Payment'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.type === 'Customer Payment' ? 'Customer Receipt' : 'Vendor Payment'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">{p.entityName}</td>

                      <td className="px-4 py-3 font-mono text-slate-700">
                        {p.invoiceOrBillNumber || <span className="text-slate-400 font-sans">Direct A/C</span>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{p.paymentMethod}</div>
                        {p.referenceNumber && (
                          <div className="font-mono text-[10px] text-slate-400">Ref: {p.referenceNumber}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[11px] text-slate-700">
                        {account?.name.split('(')[0] || 'Liquid Account'}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={p.type === 'Customer Payment' ? 'text-emerald-700' : 'text-amber-700'}>
                          {p.type === 'Customer Payment' ? '+' : '-'}
                          {formatINR(p.amount)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Payment Voucher"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModalPayment(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Payment Voucher"
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

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Edit Payment Voucher ({editingPayment.paymentNumber})
                </h3>
                <p className="text-[11px] text-slate-500">Party: {editingPayment.entityName}</p>
              </div>
              <button
                onClick={() => setEditingPayment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={editAmount}
                    onChange={e => setEditAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                  <select
                    value={editMethod}
                    onChange={e => setEditMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account</label>
                  <select
                    value={editAccountId}
                    onChange={e => setEditAccountId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {state.accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reference / UTR / Cheque #</label>
                <input
                  type="text"
                  value={editRef}
                  onChange={e => setEditRef(e.target.value)}
                  placeholder="e.g. UTR4920194829"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Modal */}
      {deleteModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Payment Voucher</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteModalPayment.paymentNumber}</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to delete payment voucher{' '}
              <strong className="text-slate-900 font-mono">{deleteModalPayment.paymentNumber}</strong> of{' '}
              <strong className="text-slate-900 font-mono">{formatINR(deleteModalPayment.amount)}</strong> for{' '}
              <strong className="text-slate-900">{deleteModalPayment.entityName}</strong>?
              Bank/cash account balance and invoice outstanding balances will be updated accordingly.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalPayment(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
