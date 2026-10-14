import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, PaymentRecord } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface PaymentModalProps {
  initialType?: 'Customer Payment' | 'Supplier Payment';
  initialInvoiceOrBillId?: string;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  initialType = 'Customer Payment',
  initialInvoiceOrBillId,
  onClose,
}) => {
  const { state, recordPayment, getNextPaymentNumber } = useApp();

  const [type, setType] = useState<'Customer Payment' | 'Supplier Payment'>(initialType);
  const [entityId, setEntityId] = useState<string>('');
  const [invoiceOrBillId, setInvoiceOrBillId] = useState<string>(initialInvoiceOrBillId || '');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [accountId, setAccountId] = useState<string>(state.accounts[0]?.id || '');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Handle initial prefill if linked to invoice
  useEffect(() => {
    if (initialInvoiceOrBillId) {
      if (initialType === 'Customer Payment') {
        const inv = state.invoices.find(i => i.id === initialInvoiceOrBillId);
        if (inv) {
          setEntityId(inv.customerId);
          setInvoiceOrBillId(inv.id);
          setAmount(inv.balanceDue);
        }
      } else {
        const bill = state.purchases.find(b => b.id === initialInvoiceOrBillId);
        if (bill) {
          setEntityId(bill.supplierId);
          setInvoiceOrBillId(bill.id);
          setAmount(bill.balanceDue);
        }
      }
    } else {
      if (type === 'Customer Payment' && state.customers.length > 0) {
        setEntityId(state.customers[0].id);
      } else if (type === 'Supplier Payment' && state.suppliers.length > 0) {
        setEntityId(state.suppliers[0].id);
      }
    }
  }, [initialInvoiceOrBillId, initialType]);

  // Available invoices or bills for selected entity
  const availableDocs = type === 'Customer Payment'
    ? state.invoices.filter(i => i.customerId === entityId && i.balanceDue > 0 && i.paymentStatus !== 'Cancelled')
    : state.purchases.filter(p => p.supplierId === entityId && p.balanceDue > 0 && p.paymentStatus !== 'Cancelled');

  const handleDocChange = (docId: string) => {
    setInvoiceOrBillId(docId);
    if (type === 'Customer Payment') {
      const inv = state.invoices.find(i => i.id === docId);
      if (inv) setAmount(inv.balanceDue);
    } else {
      const bill = state.purchases.find(b => b.id === docId);
      if (bill) setAmount(bill.balanceDue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!entityId) {
      setError(`Please select a ${type === 'Customer Payment' ? 'customer' : 'supplier'}`);
      return;
    }

    if (amount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    let entityName = '';
    let docNumber = '';

    if (type === 'Customer Payment') {
      const cust = state.customers.find(c => c.id === entityId);
      entityName = cust?.companyName || cust?.name || 'Customer';
      if (invoiceOrBillId) {
        const inv = state.invoices.find(i => i.id === invoiceOrBillId);
        docNumber = inv?.invoiceNumber || '';
      }
    } else {
      const sup = state.suppliers.find(s => s.id === entityId);
      entityName = sup?.companyName || sup?.name || 'Supplier';
      if (invoiceOrBillId) {
        const bill = state.purchases.find(p => p.id === invoiceOrBillId);
        docNumber = bill?.billNumber || '';
      }
    }

    const newPayment: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      paymentNumber: getNextPaymentNumber(type),
      type,
      entityId,
      entityName,
      invoiceOrBillId,
      invoiceOrBillNumber: docNumber,
      date,
      amount,
      paymentMethod,
      accountId,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    recordPayment(newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <h2 className="text-base font-bold text-white">Record Transaction Payment</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Type Toggle */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Transaction Nature</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('Customer Payment');
                  setEntityId(state.customers[0]?.id || '');
                  setInvoiceOrBillId('');
                }}
                className={`py-2 px-3 rounded-lg font-semibold border text-xs transition-colors ${
                  type === 'Customer Payment'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Customer Payment (Receipt)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('Supplier Payment');
                  setEntityId(state.suppliers[0]?.id || '');
                  setInvoiceOrBillId('');
                }}
                className={`py-2 px-3 rounded-lg font-semibold border text-xs transition-colors ${
                  type === 'Supplier Payment'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Supplier Payment (Disbursement)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entity Selector */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {type === 'Customer Payment' ? 'Customer' : 'Supplier'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={entityId}
                onChange={e => {
                  setEntityId(e.target.value);
                  setInvoiceOrBillId('');
                }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                {type === 'Customer Payment'
                  ? state.customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || c.name} (Due: {formatINR(c.currentBalance)})
                      </option>
                    ))
                  : state.suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.companyName || s.name} (Due: {formatINR(s.currentBalance)})
                      </option>
                    ))}
              </select>
            </div>

            {/* Linked Invoice / Bill */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Link to {type === 'Customer Payment' ? 'Invoice' : 'Bill'} (Optional)
              </label>
              <select
                value={invoiceOrBillId}
                onChange={e => handleDocChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                <option value="">-- General Account Balance --</option>
                {availableDocs.map((doc: any) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.invoiceNumber || doc.billNumber} (Due: {formatINR(doc.balanceDue)})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 bg-white text-sm"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Debit/Credit Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Bank/Cash Account */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {type === 'Customer Payment' ? 'Deposit Into Account' : 'Disburse From Account'}
              </label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                {state.accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatINR(acc.currentBalance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Transaction Ref # / UTR / Cheque #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="e.g. UTR-9948201948 or CHQ-00124"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white font-bold rounded-lg shadow-xs ${
                type === 'Customer Payment' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
