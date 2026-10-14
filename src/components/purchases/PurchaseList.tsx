import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  Ban,
  Download,
  Eye,
  FileText,
  Filter,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurchaseBill } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface PurchaseListProps {
  onOpenCreateModal: () => void;
  onEditBill: (bill: PurchaseBill) => void;
  onQuickPayment: (bill: PurchaseBill) => void;
}

export const PurchaseList: React.FC<PurchaseListProps> = ({
  onOpenCreateModal,
  onEditBill,
  onQuickPayment,
}) => {
  const { state, cancelPurchase, deletePurchase, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [voidModalBill, setVoidModalBill] = useState<PurchaseBill | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [deleteModalBill, setDeleteModalBill] = useState<PurchaseBill | null>(null);
  const [viewAttachment, setViewAttachment] = useState<{ name: string; data?: string } | null>(null);

  const filteredBills = useMemo(() => {
    return state.purchases.filter(b => {
      const matchSearch =
        b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.vendorBillNumber && b.vendorBillNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || b.paymentStatus === statusFilter;
      const matchSupplier = supplierFilter === 'all' || b.supplierId === supplierFilter;

      return matchSearch && matchStatus && matchSupplier;
    });
  }, [state.purchases, searchTerm, statusFilter, supplierFilter]);

  const totalPurchases = filteredBills
    .filter(b => b.paymentStatus !== 'Cancelled')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const totalPaid = filteredBills
    .filter(b => b.paymentStatus !== 'Cancelled')
    .reduce((sum, b) => sum + b.amountPaid, 0);

  const totalPayable = filteredBills
    .filter(b => b.paymentStatus !== 'Cancelled')
    .reduce((sum, b) => sum + b.balanceDue, 0);

  const handleExportCSV = () => {
    if (filteredBills.length === 0) {
      showToast('No bills to export', 'info');
      return;
    }
    const headers = [
      'Bill Number',
      'Vendor Bill #',
      'Date',
      'Supplier Name',
      'Supplier GSTIN',
      'State',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total Amount',
      'Amount Paid',
      'Balance Due',
      'Payment Status',
    ];

    const rows = filteredBills.map(b => [
      `"${b.billNumber}"`,
      `"${b.vendorBillNumber || ''}"`,
      `"${b.purchaseDate}"`,
      `"${b.supplierName}"`,
      `"${b.supplierGstin || ''}"`,
      `"${b.supplierState}"`,
      b.taxableAmount,
      b.cgstTotal,
      b.sgstTotal,
      b.igstTotal,
      b.totalAmount,
      b.amountPaid,
      b.balanceDue,
      `"${b.paymentStatus}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Purchase_Bills_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Purchase bills exported successfully.');
  };

  const handleConfirmCancel = () => {
    if (!voidModalBill) return;
    if (!voidReason.trim()) {
      showToast('Please enter a cancellation reason', 'error');
      return;
    }
    cancelPurchase(voidModalBill.id, voidReason.trim());
    setVoidModalBill(null);
    setVoidReason('');
  };

  const handleConfirmDelete = () => {
    if (!deleteModalBill) return;
    deletePurchase(deleteModalBill.id);
    setDeleteModalBill(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Purchases (Filtered)</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{formatINR(totalPurchases)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredBills.length} purchase invoices</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-blue-600">Paid to Vendors</span>
          <div className="mt-1 text-xl font-bold font-mono text-blue-700">{formatINR(totalPaid)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cleared through bank/cash</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600">Pending Payables</span>
          <div className="mt-1 text-xl font-bold font-mono text-amber-700">{formatINR(totalPayable)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Creditors to be disbursed</div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search internal bill #, vendor bill #, supplier..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden max-w-[160px] truncate"
          >
            <option value="all">All Suppliers</option>
            {state.suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.companyName || s.name}
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
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Purchase</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Internal Bill #</th>
                <th className="px-4 py-3">Vendor & Vendor Bill #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Taxable</th>
                <th className="px-4 py-3 text-right">Input Tax (ITC)</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No purchase bills found matching filters.
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => {
                  const itc = bill.cgstTotal + bill.sgstTotal + bill.igstTotal + bill.cessTotal;

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {bill.billNumber}
                        {bill.attachmentName && (
                          <button
                            onClick={() =>
                              setViewAttachment({ name: bill.attachmentName!, data: bill.attachmentData })
                            }
                            className="inline-flex items-center gap-0.5 ml-1 text-blue-600 hover:text-blue-800"
                            title="View Attached Bill"
                          >
                            <Paperclip className="w-3 h-3" />
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{bill.supplierName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {bill.vendorBillNumber ? `Ref: ${bill.vendorBillNumber} • ` : ''}
                          {bill.supplierGstin || 'No GSTIN'}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                        <div>{bill.purchaseDate}</div>
                        <div className="text-slate-400 text-[10px]">Due: {bill.dueDate}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatINR(bill.taxableAmount)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-sky-700 font-medium">
                        {formatINR(itc)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(bill.totalAmount)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-amber-700">
                        {formatINR(bill.balanceDue)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            bill.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bill.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : bill.paymentStatus === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800 line-through'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {bill.paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {bill.balanceDue > 0 && bill.paymentStatus !== 'Cancelled' && (
                            <button
                              onClick={() => onQuickPayment(bill)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-[11px] font-semibold border border-amber-200 mr-1"
                              title="Pay Bill"
                            >
                              Pay ₹
                            </button>
                          )}

                          {/* Edit Purchase Bill */}
                          <button
                            onClick={() => onEditBill(bill)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Purchase Bill"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Purchase Bill */}
                          <button
                            onClick={() => setDeleteModalBill(bill)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Purchase Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {bill.paymentStatus !== 'Cancelled' && (
                            <button
                              onClick={() => setVoidModalBill(bill)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                              title="Cancel / Void Bill"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Attachment View Modal */}
      {viewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">Attachment: {viewAttachment.name}</span>
              <button
                onClick={() => setViewAttachment(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center p-4 bg-slate-100 rounded-lg max-h-96 overflow-auto">
              {viewAttachment.data ? (
                <img
                  src={viewAttachment.data}
                  alt="Bill receipt"
                  className="max-h-80 object-contain rounded-sm"
                />
              ) : (
                <div className="text-xs text-slate-500 font-mono">Attachment file loaded: {viewAttachment.name}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {voidModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertOctagon className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Cancel Purchase Bill</h3>
            </div>
            <p className="text-xs text-slate-600">
              Cancelling bill <strong className="font-mono">{voidModalBill.billNumber}</strong> will
              revert product stock levels and deduct this liability from supplier outstanding.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for cancellation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="e.g. Returned goods to vendor, incorrect invoice copy"
                className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-hidden"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalBill(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Purchase Bill Modal */}
      {deleteModalBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Purchase Bill</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteModalBill.billNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete purchase bill <strong className="font-mono text-slate-900">{deleteModalBill.billNumber}</strong> from{' '}
              <strong className="text-slate-900">{deleteModalBill.supplierName}</strong> (Total:{' '}
              <strong className="text-slate-900 font-mono">{formatINR(deleteModalBill.totalAmount)}</strong>)?
              Product stock received will be deducted and supplier liability will be reversed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalBill(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
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
