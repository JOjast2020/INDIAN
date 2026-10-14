import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Income, PaymentMethod } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface IncomeModalProps {
  initialIncome?: Income | null;
  onClose: () => void;
}

const DEFAULT_INCOME_CATEGORIES = [
  'Consultation Income',
  'Service Income',
  'Commission',
  'Interest',
  'Rental Income',
  'Scrap Sale',
  'Dividend',
  'Other Income',
];

export const IncomeModal: React.FC<IncomeModalProps> = ({ initialIncome, onClose }) => {
  const { state, saveIncome } = useApp();

  const [date, setDate] = useState(
    initialIncome?.date || new Date().toISOString().substring(0, 10)
  );
  const [category, setCategory] = useState(initialIncome?.category || 'Service Income');
  const [customCat, setCustomCat] = useState('');
  const [source, setSource] = useState(initialIncome?.source || '');
  const [description, setDescription] = useState(initialIncome?.description || '');
  const [amount, setAmount] = useState<number>(initialIncome?.amount || 0);

  const [gstApplicable, setGstApplicable] = useState<boolean>(initialIncome?.gstApplicable ?? false);
  const [gstRate, setGstRate] = useState<number>(initialIncome?.gstRate ?? 18);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialIncome?.paymentMethod || 'Bank Transfer'
  );
  const [accountId, setAccountId] = useState<string>(
    initialIncome?.accountId || state.accounts[0]?.id || ''
  );
  const [referenceNumber, setReferenceNumber] = useState(initialIncome?.referenceNumber || '');
  const [notes, setNotes] = useState(initialIncome?.notes || '');

  const [error, setError] = useState('');

  const gstAmount = gstApplicable ? Math.round(((amount * gstRate) / 100) * 100) / 100 : 0;
  const totalAmount = Math.round((amount + gstAmount) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Income description is required');
      return;
    }

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const finalCat = category === '__custom__' ? customCat.trim() : category;

    const newInc: Income = {
      id: initialIncome ? initialIncome.id : `INC-${Date.now()}`,
      incomeNumber: initialIncome
        ? initialIncome.incomeNumber
        : `INC-${(state.income.length + 1).toString().padStart(3, '0')}`,
      date,
      category: finalCat || 'Other Income',
      source: source.trim(),
      description: description.trim(),
      amount,
      gstApplicable,
      gstRate: gstApplicable ? gstRate : 0,
      gstAmount,
      totalAmount,
      paymentMethod,
      accountId,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
      createdAt: initialIncome ? initialIncome.createdAt : date,
    };

    saveIncome(newInc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {initialIncome ? 'Edit Income Entry' : 'Record Non-Invoice Direct Income'}
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
              <label className="block text-slate-700 font-semibold mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Income Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                {DEFAULT_INCOME_CATEGORIES.map(cat => (
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
                placeholder="e.g. Advisory fee for architecture audit"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Client / Source Entity</label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="e.g. HDFC Bank, Client name..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Base Income Amount (₹) <span className="text-rose-500">*</span>
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

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="incGstCheck"
                checked={gstApplicable}
                onChange={e => setGstApplicable(e.target.checked)}
                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="incGstCheck" className="font-semibold text-slate-800 cursor-pointer">
                GST Collected on this income (Add output tax)
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
                  <label className="block text-slate-600 font-semibold mb-1">GST Tax Amount (₹)</label>
                  <div className="p-1.5 font-mono font-bold text-emerald-700">{formatINR(gstAmount)}</div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 font-mono text-sm">
              <span>Total Deposit Amount:</span>
              <span className="text-emerald-700">{formatINR(totalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Receipt Mode</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Deposit Into Account</label>
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
              <label className="block text-slate-700 font-semibold mb-1">Transaction Ref #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="UTR / Check #"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
              />
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
            >
              Save Income
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
