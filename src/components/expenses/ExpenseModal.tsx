import React, { useState } from 'react';
import { AlertCircle, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface ExpenseModalProps {
  initialExpense?: Expense | null;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = [
  'Rent',
  'Salary',
  'Electricity',
  'Internet',
  'Packaging',
  'Transport',
  'Advertising',
  'Software',
  'Office Expenses',
  'Travel',
  'Bank Charges',
  'Professional Fees',
  'Repairs & Maintenance',
  'Other Expenses',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ initialExpense, onClose }) => {
  const { state, saveExpense, showToast } = useApp();

  const [date, setDate] = useState(
    initialExpense?.date || new Date().toISOString().substring(0, 10)
  );
  const [category, setCategory] = useState(initialExpense?.category || 'Office Expenses');
  const [customCat, setCustomCat] = useState('');
  const [vendor, setVendor] = useState(initialExpense?.vendor || '');
  const [description, setDescription] = useState(initialExpense?.description || '');
  const [amount, setAmount] = useState<number>(initialExpense?.amount || 0);

  const [gstApplicable, setGstApplicable] = useState<boolean>(
    initialExpense?.gstApplicable ?? false
  );
  const [gstRate, setGstRate] = useState<number>(initialExpense?.gstRate ?? 18);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialExpense?.paymentMethod || 'Bank Transfer'
  );
  const [accountId, setAccountId] = useState<string>(
    initialExpense?.accountId || state.accounts[0]?.id || ''
  );
  const [referenceNumber, setReferenceNumber] = useState(initialExpense?.referenceNumber || '');
  const [notes, setNotes] = useState(initialExpense?.notes || '');

  const [attachmentName, setAttachmentName] = useState(initialExpense?.attachmentName || '');
  const [attachmentData, setAttachmentData] = useState(initialExpense?.attachmentData || '');

  const [error, setError] = useState('');

  const gstAmount = gstApplicable ? Math.round(((amount * gstRate) / 100) * 100) / 100 : 0;
  const totalAmount = Math.round((amount + gstAmount) * 100) / 100;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Attachment exceeds 5MB limit', 'error');
      return;
    }
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => setAttachmentData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Expense description is required');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const finalCategory = category === '__custom__' ? customCat.trim() : category;

    const newExp: Expense = {
      id: initialExpense ? initialExpense.id : `EXP-${Date.now()}`,
      expenseNumber: initialExpense
        ? initialExpense.expenseNumber
        : `EXP-${(state.expenses.length + 1).toString().padStart(3, '0')}`,
      date,
      category: finalCategory || 'Other Expenses',
      vendor: vendor.trim(),
      description: description.trim(),
      amount,
      gstApplicable,
      gstRate: gstApplicable ? gstRate : 0,
      gstAmount,
      totalAmount,
      paymentMethod,
      accountId,
      referenceNumber: referenceNumber.trim(),
      attachmentName,
      attachmentData,
      notes: notes.trim(),
      createdAt: initialExpense ? initialExpense.createdAt : date,
    };

    saveExpense(newExp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {initialExpense ? 'Edit Business Expense' : 'Record Business Expense'}
          </h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                {DEFAULT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Custom Category...</option>
              </select>
              {category === '__custom__' && (
                <input
                  type="text"
                  required
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  placeholder="Enter custom category"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 mt-1.5 text-slate-900 bg-white"
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Description / Particulars <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Adani electricity bill CA# 102938481"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Supplier / Payee Vendor</label>
              <input
                type="text"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                placeholder="e.g. Tata Teleservices Ltd"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Base Expense Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white font-semibold"
              />
            </div>
          </div>

          {/* GST Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="expGstCheck"
                checked={gstApplicable}
                onChange={e => setGstApplicable(e.target.checked)}
                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="expGstCheck" className="font-semibold text-slate-800 cursor-pointer">
                GST is applicable on this expense (Claim Input Tax Credit)
              </label>
            </div>

            {gstApplicable && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">GST Rate (%)</label>
                  <select
                    value={gstRate}
                    onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">GST Input Tax (₹)</label>
                  <div className="p-1.5 font-mono font-bold text-sky-700">{formatINR(gstAmount)}</div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 font-mono text-sm">
              <span>Total Disbursed:</span>
              <span className="text-rose-600">{formatINR(totalAmount)}</span>
            </div>
          </div>

          {/* Payment & Account Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Paid From Account</label>
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

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Reference / UTR / Voucher #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR49201938"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Bill / Receipt Attachment</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-medium flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Bill Receipt</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {attachmentName && <span className="text-slate-600 font-mono text-[11px]">{attachmentName}</span>}
            </div>
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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
            >
              Record Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
