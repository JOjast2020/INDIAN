import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit2,
  Eye,
  FileText,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Invoice, PaymentRecord } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface CustomerListProps {
  onOpenCreateModal: () => void;
  onEditCustomer: (cust: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onOpenCreateModal,
  onEditCustomer,
}) => {
  const { state, deleteCustomer, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfileCust, setSelectedProfileCust] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    return state.customers.filter(c => {
      return (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile.includes(searchTerm) ||
        c.gstin.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [state.customers, searchTerm]);

  const totalOutstanding = state.customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  // For Profile Modal
  const customerInvoices = useMemo(() => {
    if (!selectedProfileCust) return [];
    return state.invoices.filter(i => i.customerId === selectedProfileCust.id);
  }, [selectedProfileCust, state.invoices]);

  const customerPayments = useMemo(() => {
    if (!selectedProfileCust) return [];
    return state.payments.filter(
      p => p.entityId === selectedProfileCust.id && p.type === 'Customer Payment'
    );
  }, [selectedProfileCust, state.payments]);

  const totalSalesToCust = customerInvoices
    .filter(i => i.paymentStatus !== 'Cancelled')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalPaidByCust = customerPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Customers</span>
          <div className="mt-1 text-xl font-bold font-mono text-slate-900">{state.customers.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active accounts in master</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-emerald-600">Registered GST Customers</span>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-700">
            {state.customers.filter(c => c.gstin).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Eligible for B2B tax invoice</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-rose-600">Total Outstanding (Receivables)</span>
          <div className="mt-1 text-xl font-bold font-mono text-rose-700">{formatINR(totalOutstanding)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sum of all customer debit balances</div>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search customer by name, company, mobile, GSTIN..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-hidden"
          />
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Customer Code</th>
                <th className="px-4 py-3">Company & Contact</th>
                <th className="px-4 py-3">GSTIN & State</th>
                <th className="px-4 py-3">Phone & Email</th>
                <th className="px-4 py-3 text-right">Credit Limit</th>
                <th className="px-4 py-3 text-right">Outstanding Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{cust.customerId}</td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{cust.companyName || cust.name}</div>
                      {cust.companyName && cust.name && (
                        <div className="text-[11px] text-slate-500">{cust.name}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800">{cust.gstin || 'Unregistered'}</div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        {cust.state} ({cust.stateCode})
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-mono text-[11px]">{cust.mobile || '-'}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[150px]">{cust.email || '-'}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatINR(cust.creditLimit)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span className={cust.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        {formatINR(cust.currentBalance)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedProfileCust(cust)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md"
                          title="View Ledger Statement"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditCustomer(cust)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remove customer ${cust.name}?`)) {
                              deleteCustomer(cust.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                          title="Delete Customer"
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

      {/* Customer Profile & Ledger Statement Modal */}
      {selectedProfileCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedProfileCust.companyName || selectedProfileCust.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 font-mono">
                    {selectedProfileCust.customerId}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Customer Ledger & Transaction Statement</p>
              </div>
              <button
                onClick={() => setSelectedProfileCust(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Profile Overview Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Invoiced (Sales):</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {formatINR(totalSalesToCust)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {customerInvoices.length} invoices generated
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Total Payments Received:</span>
                  <span className="font-mono font-bold text-emerald-700 text-base">
                    {formatINR(totalPaidByCust)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {customerPayments.length} payment receipts
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block">Outstanding Balance Due:</span>
                  <span className="font-mono font-bold text-rose-600 text-base">
                    {formatINR(selectedProfileCust.currentBalance)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Credit Limit: {formatINR(selectedProfileCust.creditLimit)}
                  </span>
                </div>
              </div>

              {/* Invoices History */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Invoice Billing History</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Invoice #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Taxable</th>
                        <th className="p-2 text-right">Total Amount</th>
                        <th className="p-2 text-right">Paid</th>
                        <th className="p-2 text-right">Balance</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400">
                            No invoices recorded yet.
                          </td>
                        </tr>
                      ) : (
                        customerInvoices.map(inv => (
                          <tr key={inv.id}>
                            <td className="p-2 font-mono font-semibold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="p-2 font-mono text-slate-600">{inv.invoiceDate}</td>
                            <td className="p-2 text-right font-mono">{formatINR(inv.taxableAmount)}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              {formatINR(inv.totalAmount)}
                            </td>
                            <td className="p-2 text-right font-mono text-emerald-700">
                              {formatINR(inv.amountPaid)}
                            </td>
                            <td className="p-2 text-right font-mono text-rose-600 font-semibold">
                              {formatINR(inv.balanceDue)}
                            </td>
                            <td className="p-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-medium">
                                {inv.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments History */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Payment Receipts History</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                      <tr>
                        <th className="p-2">Receipt #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Invoice Ref</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Reference / UTR</th>
                        <th className="p-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400">
                            No payment receipts recorded yet.
                          </td>
                        </tr>
                      ) : (
                        customerPayments.map(p => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono font-semibold text-slate-900">{p.paymentNumber}</td>
                            <td className="p-2 font-mono text-slate-600">{p.date}</td>
                            <td className="p-2 font-mono text-slate-700">{p.invoiceOrBillNumber || '-'}</td>
                            <td className="p-2">{p.paymentMethod}</td>
                            <td className="p-2 font-mono text-slate-600">{p.referenceNumber || '-'}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-700">
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
                onClick={() => setSelectedProfileCust(null)}
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
