import React, { useState } from 'react';
import { AlertCircle, ArrowRightLeft, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountTransfer } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface TransferModalProps {
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ onClose }) => {
  const { state, recordTransfer } = useApp();

  const [fromAccountId, setFromAccountId] = useState(state.accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(state.accounts[1]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const fromAcc = state.accounts.find(a => a.id === fromAccountId);
  const toAcc = state.accounts.find(a => a.id === toAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fromAccountId === toAccountId) {
      setError('Source and Destination accounts must be different');
      return;
    }

    if (amount <= 0) {
      setError('Transfer amount must be greater than zero');
      return;
    }

    if (fromAcc && fromAcc.currentBalance < amount) {
      setError(`Insufficient balance in ${fromAcc.name}. Available: ${formatINR(fromAcc.currentBalance)}`);
      return;
    }

    const newTransfer: AccountTransfer = {
      id: `TRF-${Date.now()}`,
      transferNumber: `CNTR-${(state.transfers.length + 1).toString().padStart(3, '0')}`,
      date,
      fromAccountId,
      toAccountId,
      amount,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    recordTransfer(newTransfer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 text-slate-900">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm">Contra Transfer (Cash / Bank)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">From Account (Debit)</label>
            <select
              value={fromAccountId}
              onChange={e => setFromAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
            >
              {state.accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Bal: {formatINR(acc.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">To Account (Credit)</label>
            <select
              value={toAccountId}
              onChange={e => setToAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 bg-white"
            >
              {state.accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Bal: {formatINR(acc.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-slate-700 font-semibold mb-1">Transfer Amount (₹)</label>
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
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Ref / Cheque / UTR #</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="e.g. CASH-DEP-01"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Cash deposited to bank, etc."
              className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
            >
              Complete Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
