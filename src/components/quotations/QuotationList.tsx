import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  IndianRupee,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Quotation, QuotationStatus } from '../../types';
import { formatINR } from '../../utils/indianGST';
import { QuotationFormModal } from './QuotationFormModal';
import { QuotationPrintModal } from './QuotationPrintModal';

interface QuotationListProps {
  onOpenCreateModal?: () => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export const QuotationList: React.FC<QuotationListProps> = ({
  onOpenCreateModal,
  onNavigateToInvoice,
}) => {
  const { state, deleteQuotation, convertQuotationToInvoice, showToast } = useApp();
  const quotations = state.quotations || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [deleteModalQuote, setDeleteModalQuote] = useState<Quotation | null>(null);
  const [convertModalQuote, setConvertModalQuote] = useState<Quotation | null>(null);

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch =
        q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.customerGstin && q.customerGstin.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchCustomer = customerFilter === 'all' || q.customerId === customerFilter;

      return matchSearch && matchStatus && matchCustomer;
    });
  }, [quotations, searchTerm, statusFilter, customerFilter]);

  // KPIs
  const totalQuotesCount = quotations.length;
  const totalValue = quotations.reduce((sum, q) => sum + q.totalAmount, 0);
  const convertedCount = quotations.filter(q => q.status === 'Converted').length;
  const pendingQuotes = quotations.filter(q => q.status === 'Sent' || q.status === 'Draft' || q.status === 'Accepted');
  const pendingValue = pendingQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
  const conversionRate = totalQuotesCount > 0 ? Math.round((convertedCount / totalQuotesCount) * 100) : 0;

  const handleExportCSV = () => {
    if (filteredQuotations.length === 0) {
      showToast('No quotations to export', 'info');
      return;
    }

    const headers = [
      'Quotation Number',
      'Date',
      'Valid Until',
      'Customer Name',
      'Customer GSTIN',
      'Place of Supply',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total Amount',
      'Status',
      'Converted Invoice #',
    ];

    const rows = filteredQuotations.map(q => [
      `"${q.quotationNumber}"`,
      `"${q.quotationDate}"`,
      `"${q.validUntil}"`,
      `"${q.customerName.replace(/"/g, '""')}"`,
      `"${q.customerGstin || ''}"`,
      `"${q.placeOfSupply}"`,
      q.taxableAmount.toFixed(2),
      q.cgstTotal.toFixed(2),
      q.sgstTotal.toFixed(2),
      q.igstTotal.toFixed(2),
      q.totalAmount.toFixed(2),
      `"${q.status}"`,
      `"${q.convertedInvoiceNumber || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Quotations_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Quotations exported to CSV successfully.');
  };

  const handleConfirmDelete = () => {
    if (!deleteModalQuote) return;
    deleteQuotation(deleteModalQuote.id);
    setDeleteModalQuote(null);
  };

  const handleConfirmConvert = () => {
    if (!convertModalQuote) return;
    try {
      const generatedInvoice = convertQuotationToInvoice(convertModalQuote.id);
      setConvertModalQuote(null);
      showToast(`Quotation converted to Tax Invoice ${generatedInvoice.invoiceNumber}!`, 'success');
      if (onNavigateToInvoice) {
        onNavigateToInvoice(generatedInvoice.id);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to convert quotation', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Quotations</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">{totalQuotesCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Value: {formatINR(totalValue)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">Pending Quotes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-700">{pendingQuotes.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pipeline: {formatINR(pendingValue)}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">Converted Invoices</span>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-700">{convertedCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sales materialized</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-600">Conversion Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-indigo-700">{conversionRate}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Inquiry-to-Invoice ratio</div>
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
            placeholder="Search quotation number, customer name, GSTIN..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-hidden"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Converted">Converted</option>
            <option value="Expired">Expired</option>
            <option value="Rejected">Rejected</option>
          </select>

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

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => {
              setEditingQuotation(null);
              setFormModalOpen(true);
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Quote #</th>
                <th className="px-4 py-3">Customer & Supply</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3 text-right">Taxable (₹)</th>
                <th className="px-4 py-3 text-right">GST (₹)</th>
                <th className="px-4 py-3 text-right">Total (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No quotations found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map(q => {
                  const totalGst = q.cgstTotal + q.sgstTotal + q.igstTotal + q.cessTotal;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Quote # */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{q.quotationNumber}</span>
                          {q.convertedInvoiceNumber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-sans font-semibold border border-emerald-200">
                              → {q.convertedInvoiceNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                          {q.items.length} item(s)
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 max-w-[200px] truncate">
                          {q.customerName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="font-mono">{q.customerGstin || 'Unregistered'}</span>
                          <span>•</span>
                          <span>{q.placeOfSupply}</span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div className="text-slate-800">Date: {q.quotationDate}</div>
                        <div className="text-slate-400">Valid: {q.validUntil}</div>
                      </td>

                      {/* Taxable */}
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatINR(q.taxableAmount)}
                      </td>

                      {/* GST */}
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatINR(totalGst)}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(q.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            q.status === 'Converted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : q.status === 'Accepted'
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : q.status === 'Sent'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : q.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1-Click Convert to Invoice Button */}
                          {q.status !== 'Converted' && (
                            <button
                              onClick={() => setConvertModalQuote(q)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-semibold border border-emerald-200 transition-colors mr-1 flex items-center gap-1"
                              title="Convert to Sales Tax Invoice"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {/* View / Print */}
                          <button
                            onClick={() => setViewingQuotation(q)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            title="View / Print Quotation"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-600" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingQuotation(q);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit Quotation"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteModalQuote(q)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Quotation"
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

      {/* Delete Quotation Modal */}
      {deleteModalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Quotation</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteModalQuote.quotationNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete quotation{' '}
              <strong className="text-slate-900 font-mono">{deleteModalQuote.quotationNumber}</strong> for{' '}
              <strong className="text-slate-900">{deleteModalQuote.customerName}</strong> (Total:{' '}
              <strong className="text-slate-900 font-mono">{formatINR(deleteModalQuote.totalAmount)}</strong>)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalQuote(null)}
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

      {/* Convert to Invoice Modal Confirmation */}
      {convertModalQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Convert to Tax Invoice</h3>
                <p className="text-xs text-slate-500 font-mono">{convertModalQuote.quotationNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will automatically generate a new official GST Sales Tax Invoice for{' '}
              <strong className="text-slate-900">{convertModalQuote.customerName}</strong> for{' '}
              <strong className="text-slate-900 font-mono">{formatINR(convertModalQuote.totalAmount)}</strong>.
              Product stock will be deducted and customer accounts updated automatically.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConvertModalQuote(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Confirm & Generate Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {formModalOpen && (
        <QuotationFormModal
          initialQuotation={editingQuotation}
          onClose={() => {
            setFormModalOpen(false);
            setEditingQuotation(null);
          }}
        />
      )}

      {/* Print / View Modal */}
      {viewingQuotation && (
        <QuotationPrintModal
          quotation={viewingQuotation}
          onClose={() => setViewingQuotation(null)}
          onConvertToInvoice={q => {
            setViewingQuotation(null);
            setConvertModalQuote(q);
          }}
        />
      )}
    </div>
  );
};
