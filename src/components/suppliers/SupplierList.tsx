import React, { useMemo, useState } from 'react';
import {
  Building2,
  Edit2,
  Eye,
  FileText,
  Plus,
  Receipt,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PurchaseBill, Supplier } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface SupplierListProps {
  onOpenCreateModal: () => void;
  onEditSupplier: (sup: Supplier) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({
  onOpenCreateModal,
  onEditSupplier,
}) => {
  const { state, deleteSupplier } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileSup, setSelectedProfileSup] = useState<Supplier | null>(null);

  const filteredSuppliers = useMemo(() => {
    return state.suppliers.filter(s => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.mobile.includes(searchTerm) ||
        s.gstin.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [state.suppliers, searchTerm]);

  const totalOutstanding = state.suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);

  const supplierPurchases = useMemo(() => {
    if (!selectedProfileSup) return [];
    return state.purchases.filter(p => p.supplierId === selectedProfileSup.id);
  }, [selectedProfileSup, state.purchases]);

  const supplierPayments = useMemo(() => {
    if (!selectedProfileSup) return [];
    return state.payments.filter(
      p => p.entityId === selectedProfileSup.id && p.type === 'Supplier Payment'
    );
  }, [selectedProfileSup, state.payments]);

  const totalPurchasesFromSup = supplierPurchases
    .filter(p => p.paymentStatus !== 'Cancelled')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const totalPaidToSup = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Suppliers</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{state.suppliers.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Approved vendors & suppliers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-blue-600">Registered GST Vendors</span>
          <div className="mt-1 text-xl font-bold font-mono text-blue-700">
            {state.suppliers.filter(s => s.gstin).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Input tax credit eligible suppliers</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-amber-600">Total Payable Outstanding</span>
          <div className="mt-1 text-xl font-bold font-mono text-amber-700">{formatINR(totalOutstanding)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Liabilities owed to suppliers</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search supplier by company, contact person, GSTIN..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-hidden"
          />
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Supplier</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Supplier Code</th>
                <th className="px-4 py-3">Company & Contact</th>
                <th className="px-4 py-3">GSTIN & State</th>
                <th className="px-4 py-3">Mobile & Email</th>
                <th className="px-4 py-3 text-right">Payable Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{sup.supplierId}</td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{sup.companyName || sup.name}</div>
                      {sup.companyName && sup.name && (
                        <div className="text-[11px] text-slate-500">{sup.name}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800">{sup.gstin || 'Unregistered'}</div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        {sup.state} ({sup.stateCode})
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-mono text-[11px]">{sup.mobile || '-'}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[150px]">{sup.email || '-'}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                      {formatINR(sup.currentBalance)}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedProfileSup(sup)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          title="View Vendor Ledger"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditSupplier(sup)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remove supplier ${sup.name}?`)) {
                              deleteSupplier(sup.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Profile / Ledger Modal */}
      {selectedProfileSup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedProfileSup.companyName || selectedProfileSup.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 font-mono">
                    {selectedProfileSup.supplierId}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Supplier Ledger & Purchase Bill History</p>
              </div>
              <button
                onClick={() => setSelectedProfileSup(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Inward Purchases:</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {formatINR(totalPurchasesFromSup)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {supplierPurchases.length} bills received
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Total Disbursed (Paid):</span>
                  <span className="font-mono font-bold text-blue-700 text-base">
                    {formatINR(totalPaidToSup)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {supplierPayments.length} payment disbursements
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Current Payable Due:</span>
                  <span className="font-mono font-bold text-amber-700 text-base">
                    {formatINR(selectedProfileSup.currentBalance)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    GSTIN: {selectedProfileSup.gstin || 'Unregistered'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Purchase Bills Recorded</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Bill #</th>
                        <th className="p-2">Vendor Ref</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Taxable</th>
                        <th className="p-2 text-right">Total Amount</th>
                        <th className="p-2 text-right">Paid</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">
                            No bills recorded from this supplier yet.
                          </td>
                        </tr>
                      ) : (
                        supplierPurchases.map(b => (
                          <tr key={b.id}>
                            <td className="p-2 font-mono font-semibold text-slate-900">{b.billNumber}</td>
                            <td className="p-2 font-mono text-slate-600">{b.vendorBillNumber || '-'}</td>
                            <td className="p-2 font-mono text-slate-600">{b.purchaseDate}</td>
                            <td className="p-2 text-right font-mono">{formatINR(b.taxableAmount)}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {formatINR(b.totalAmount)}
                            </td>
                            <td className="p-2 text-right font-mono text-blue-700">{formatINR(b.amountPaid)}</td>
                            <td className="p-2 text-right font-mono text-amber-700 font-semibold">
                              {formatINR(b.balanceDue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Payments Disbursed</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Payment #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Bill Ref</th>
                        <th className="p-2">Method</th>
                        <th className="p-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            No payments disbursed yet.
                          </td>
                        </tr>
                      ) : (
                        supplierPayments.map(p => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono font-semibold text-slate-900">{p.paymentNumber}</td>
                            <td className="p-2 font-mono text-slate-600">{p.date}</td>
                            <td className="p-2 font-mono text-slate-700">{p.invoiceOrBillNumber || '-'}</td>
                            <td className="p-2">{p.paymentMethod}</td>
                            <td className="p-2 text-right font-mono font-bold text-blue-700">
                              {formatINR(p.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedProfileSup(null)}
                className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg text-xs"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
