import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  FileUp,
  Filter,
  IndianRupee,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice, PaymentStatus } from '../../types';
import { formatINR } from '../../utils/indianGST';
import { UploadOldInvoiceModal } from './UploadOldInvoiceModal';

interface InvoiceListProps {
  onOpenCreateModal: () => void;
  onEditInvoice: (inv: Invoice) => void;
  onViewInvoice: (inv: Invoice) => void;
  onPrintInvoice: (inv: Invoice) => void;
  onQuickPayment: (inv: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  onOpenCreateModal,
  onEditInvoice,
  onViewInvoice,
  onPrintInvoice,
  onQuickPayment,
}) => {
  const { state, cancelInvoice, deleteInvoice, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [voidModalInv, setVoidModalInv] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState<string>('');
  const [deleteModalInv, setDeleteModalInv] = useState<Invoice | null>(null);
  const [uploadOldModalOpen, setUploadOldModalOpen] = useState<boolean>(false);
  const [attachmentViewer, setAttachmentViewer] = useState<{ name: string; data?: string } | null>(null);

  const filteredInvoices = useMemo(() => {
    return state.invoices.filter(inv => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customerGstin && inv.customerGstin.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;
      const matchCustomer = customerFilter === 'all' || inv.customerId === customerFilter;

      return matchSearch && matchStatus && matchCustomer;
    });
  }, [state.invoices, searchTerm, statusFilter, customerFilter]);

  // Aggregates
  const totalInvoiced = filteredInvoices
    .filter(i => i.paymentStatus !== 'Cancelled')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalCollected = filteredInvoices
    .filter(i => i.paymentStatus !== 'Cancelled')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const totalBalanceDue = filteredInvoices
    .filter(i => i.paymentStatus !== 'Cancelled')
    .reduce((sum, i) => sum + i.balanceDue, 0);

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      showToast('No invoices to export', 'info');
      return;
    }
    const headers = [
      'Invoice Number',
      'Date',
      'Due Date',
      'Customer Name',
      'Customer GSTIN',
      'Place of Supply',
      'Supply Type',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total Amount',
      'Amount Paid',
      'Balance Due',
      'Payment Status',
    ];

    const rows = filteredInvoices.map(i => [
      `"${i.invoiceNumber}"`,
      `"${i.invoiceDate}"`,
      `"${i.dueDate}"`,
      `"${i.customerName}"`,
      `"${i.customerGstin || ''}"`,
      `"${i.placeOfSupply}"`,
      `"${i.isInterstate ? 'Interstate' : 'Intrastate'}"`,
      i.taxableAmount,
      i.cgstTotal,
      i.sgstTotal,
      i.igstTotal,
      i.totalAmount,
      i.amountPaid,
      i.balanceDue,
      `"${i.paymentStatus}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoices_Export_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Invoices exported to CSV successfully.');
  };

  const handleConfirmCancel = () => {
    if (!voidModalInv) return;
    if (!voidReason.trim()) {
      showToast('Please state a reason for cancelling the invoice', 'error');
      return;
    }
    cancelInvoice(voidModalInv.id, voidReason.trim());
    setVoidModalInv(null);
    setVoidReason('');
  };

  const handleConfirmDelete = () => {
    if (!deleteModalInv) return;
    deleteInvoice(deleteModalInv.id);
    setDeleteModalInv(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Aggregates Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Invoiced (Filtered)</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{formatINR(totalInvoiced)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredInvoices.length} total bills</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600">Total Collected</span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-700">{formatINR(totalCollected)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Realized in cash/bank accounts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-rose-600">Outstanding Receivables</span>
          <div className="mt-1 text-xl font-bold font-mono text-rose-700">{formatINR(totalBalanceDue)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending collection from customers</div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search invoice number, customer name, GSTIN..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status Select */}
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

          {/* Customer Select */}
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden max-w-[160px] truncate"
          >
            <option value="all">All Customers</option>
            {state.customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.companyName || c.name}
              </option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Upload Old Invoice */}
          <button
            onClick={() => setUploadOldModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
            title="Upload old invoice PDF or scan"
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Old Invoice</span>
          </button>

          {/* Create New */}
          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer & Place of Supply</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3 text-right">Taxable</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No tax invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const totalGst = inv.cgstTotal + inv.sgstTotal + inv.igstTotal + inv.cessTotal;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice # */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center flex-wrap gap-1">
                          <span>{inv.invoiceNumber}</span>
                          {inv.attachmentData && (
                            <button
                              onClick={() =>
                                setAttachmentViewer({
                                  name: inv.attachmentName || 'Invoice_Document.pdf',
                                  data: inv.attachmentData,
                                })
                              }
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                              title="View attached old invoice PDF / scan"
                            >
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>PDF</span>
                            </button>
                          )}
                          {inv.isImported && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Imported
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                          {inv.items.length} item(s)
                        </div>
                      </td>

                      {/* Customer & Supply */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 max-w-[200px] truncate">
                          {inv.customerName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">{inv.customerGstin || 'Unregistered'}</span>
                          <span>•</span>
                          <span className="text-slate-600">
                            {inv.isInterstate ? 'IGST' : 'CGST+SGST'} ({inv.placeOfSupply})
                          </span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div className="text-slate-800">Date: {inv.invoiceDate}</div>
                        <div className="text-slate-400">Due: {inv.dueDate}</div>
                      </td>

                      {/* Taxable */}
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatINR(inv.taxableAmount)}
                      </td>

                      {/* GST */}
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatINR(totalGst)}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(inv.totalAmount)}
                      </td>

                      {/* Balance Due */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600">
                        {formatINR(inv.balanceDue)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.paymentStatus === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800 line-through'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Receive Payment Quick Action */}
                          {inv.balanceDue > 0 && inv.paymentStatus !== 'Cancelled' && (
                            <button
                              onClick={() => onQuickPayment(inv)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-semibold border border-emerald-200 transition-colors mr-1"
                              title="Receive Payment"
                            >
                              Receive ₹
                            </button>
                          )}

                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Print / PDF Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Invoice */}
                          <button
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Invoice */}
                          <button
                            onClick={() => setDeleteModalInv(inv)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {inv.paymentStatus !== 'Cancelled' && (
                            <button
                              onClick={() => setVoidModalInv(inv)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Cancel / Void Invoice"
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

      {/* Cancel / Void Invoice Modal Dialog */}
      {voidModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertOctagon className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Cancel & Void Invoice</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel invoice{' '}
              <strong className="font-mono text-slate-900">{voidModalInv.invoiceNumber}</strong>? In
              accordance with GST audit trail principles, the invoice will not be hard-deleted but
              marked as <strong>Cancelled/Void</strong>, product stock will be returned to inventory,
              and customer receivable balance will be reversed.
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
                placeholder="e.g. Order cancelled by client, incorrect tax rate entered"
                className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalInv(null)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Invoice Modal Dialog */}
      {deleteModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Invoice</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteModalInv.invoiceNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this invoice for{' '}
              <strong className="text-slate-900">{deleteModalInv.customerName}</strong> (Total:{' '}
              <strong className="text-slate-900 font-mono">{formatINR(deleteModalInv.totalAmount)}</strong>)?
              Inventory stock will be restored and customer outstanding balance will be reverted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalInv(null)}
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

      {/* Attachment Viewer Modal */}
      {attachmentViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-sm text-white">
                  Attached Document: {attachmentViewer.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {attachmentViewer.data && (
                  <a
                    href={attachmentViewer.data}
                    download={attachmentViewer.name}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  onClick={() => setAttachmentViewer(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-slate-100 flex items-center justify-center overflow-auto min-h-[400px]">
              {attachmentViewer.data ? (
                attachmentViewer.name.toLowerCase().endsWith('.pdf') ? (
                  <object
                    data={attachmentViewer.data}
                    type="application/pdf"
                    className="w-full h-[65vh] rounded-lg border border-slate-200 bg-white"
                  >
                    <div className="p-8 text-center text-slate-600">
                      <FileText className="w-16 h-16 mx-auto text-indigo-500 mb-3" />
                      <p className="font-bold text-sm">PDF Document: {attachmentViewer.name}</p>
                      <a
                        href={attachmentViewer.data}
                        download={attachmentViewer.name}
                        className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs"
                      >
                        Download PDF
                      </a>
                    </div>
                  </object>
                ) : (
                  <img
                    src={attachmentViewer.data}
                    alt={attachmentViewer.name}
                    className="max-h-[65vh] object-contain rounded-lg shadow-md"
                  />
                )
              ) : (
                <div className="text-slate-400 text-xs">No preview available for this document.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Old Invoice Modal */}
      {uploadOldModalOpen && (
        <UploadOldInvoiceModal onClose={() => setUploadOldModalOpen(false)} />
      )}
    </div>
  );
};
