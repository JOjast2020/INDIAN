import React, { useState } from 'react';
import { AlertCircle, Pencil, Plus, Scale, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditNote, DebitNote } from '../../types';
import { formatINR, getFinancialYear } from '../../utils/indianGST';

export const CreditDebitNotes: React.FC = () => {
  const { state, saveCreditNote, deleteCreditNote, saveDebitNote, deleteDebitNote, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'credit' | 'debit'>('credit');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalNote, setDeleteModalNote] = useState<{
    type: 'credit' | 'debit';
    id: string;
    number: string;
    entity: string;
    amount: number;
  } | null>(null);

  // Form State
  const [noteNumber, setNoteNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [entityId, setEntityId] = useState('');
  const [originalDocId, setOriginalDocId] = useState('');
  const [reason, setReason] = useState('Sales Return / Defective Goods');
  const [amount, setAmount] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const totalAmount = Math.round((amount + gstAmount) * 100) / 100;

  const handleOpenModal = (tab: 'credit' | 'debit') => {
    setActiveTab(tab);
    setEditingId(null);
    const fy = getFinancialYear();
    if (tab === 'credit') {
      setNoteNumber(
        `${state.settings.creditNotePrefix}/${fy}/${(state.creditNotes.length + 1).toString().padStart(4, '0')}`
      );
      setEntityId(state.customers[0]?.id || '');
      setReason('Goods returned / Quality discrepancy');
    } else {
      setNoteNumber(
        `${state.settings.debitNotePrefix}/${fy}/${(state.debitNotes.length + 1).toString().padStart(4, '0')}`
      );
      setEntityId(state.suppliers[0]?.id || '');
      setReason('Goods returned to supplier / Rate variance');
    }
    setOriginalDocId('');
    setAmount(0);
    setGstAmount(0);
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const handleEditCreditNote = (cn: CreditNote) => {
    setActiveTab('credit');
    setEditingId(cn.id);
    setNoteNumber(cn.noteNumber);
    setDate(cn.date);
    setEntityId(cn.customerId);
    setOriginalDocId(cn.originalInvoiceId || '');
    setReason(cn.reason);
    setAmount(cn.amount);
    setGstAmount(cn.gstAmount);
    setNotes(cn.notes || '');
    setError('');
    setShowModal(true);
  };

  const handleEditDebitNote = (dn: DebitNote) => {
    setActiveTab('debit');
    setEditingId(dn.id);
    setNoteNumber(dn.noteNumber);
    setDate(dn.date);
    setEntityId(dn.supplierId);
    setOriginalDocId(dn.originalBillId || '');
    setReason(dn.reason);
    setAmount(dn.amount);
    setGstAmount(dn.gstAmount);
    setNotes(dn.notes || '');
    setError('');
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalNote) return;
    if (deleteModalNote.type === 'credit') {
      deleteCreditNote(deleteModalNote.id);
    } else {
      deleteDebitNote(deleteModalNote.id);
    }
    setDeleteModalNote(null);
  };

  const handleAmountChange = (baseVal: number) => {
    setAmount(baseVal);
    // Auto-calculate 18% standard GST portion
    setGstAmount(Math.round(((baseVal * 18) / 100) * 100) / 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (activeTab === 'credit') {
      const cust = state.customers.find(c => c.id === entityId);
      const inv = state.invoices.find(i => i.id === originalDocId);

      const cn: CreditNote = {
        id: editingId || `CN-${Date.now()}`,
        noteNumber,
        originalInvoiceId: originalDocId,
        originalInvoiceNumber: inv?.invoiceNumber || 'Direct Adjustment',
        customerId: entityId,
        customerName: cust?.companyName || cust?.name || 'Customer',
        date,
        reason,
        amount,
        gstAmount,
        totalAmount,
        notes,
        createdAt: date,
      };

      saveCreditNote(cn);
    } else {
      const sup = state.suppliers.find(s => s.id === entityId);
      const bill = state.purchases.find(p => p.id === originalDocId);

      const dn: DebitNote = {
        id: editingId || `DN-${Date.now()}`,
        noteNumber,
        originalBillId: originalDocId,
        originalBillNumber: bill?.billNumber || 'Direct Adjustment',
        supplierId: entityId,
        supplierName: sup?.companyName || sup?.name || 'Supplier',
        date,
        reason,
        amount,
        gstAmount,
        totalAmount,
        notes,
        createdAt: date,
      };

      saveDebitNote(dn);
    }

    setShowModal(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Action */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
          <button
            onClick={() => setActiveTab('credit')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'credit' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Credit Notes (Sales Returns - {state.creditNotes.length})
          </button>
          <button
            onClick={() => setActiveTab('debit')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'debit' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Debit Notes (Purchase Returns - {state.debitNotes.length})
          </button>
        </div>

        <button
          onClick={() => handleOpenModal(activeTab)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{activeTab === 'credit' ? 'Issue Credit Note' : 'Issue Debit Note'}</span>
        </button>
      </div>

      {/* Credit Notes Table */}
      {activeTab === 'credit' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Note #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Original Invoice #</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Total (₹)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {state.creditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-sans">
                      No credit notes issued.
                    </td>
                  </tr>
                ) : (
                  state.creditNotes.map(cn => (
                    <tr key={cn.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">{cn.noteNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{cn.date}</td>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-800">{cn.customerName}</td>
                      <td className="px-4 py-3 text-slate-700">{cn.originalInvoiceNumber}</td>
                      <td className="px-4 py-3 font-sans text-slate-600">{cn.reason}</td>
                      <td className="px-4 py-3 text-right">{formatINR(cn.amount)}</td>
                      <td className="px-4 py-3 text-right text-sky-700">{formatINR(cn.gstAmount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">{formatINR(cn.totalAmount)}</td>
                      <td className="px-4 py-3 text-right font-sans whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditCreditNote(cn)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Credit Note"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModalNote({
                                type: 'credit',
                                id: cn.id,
                                number: cn.noteNumber,
                                entity: cn.customerName,
                                amount: cn.totalAmount,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Credit Note"
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
      ) : (
        /* Debit Notes Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Note #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Original Purchase Bill #</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Total (₹)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {state.debitNotes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-sans">
                      No debit notes issued.
                    </td>
                  </tr>
                ) : (
                  state.debitNotes.map(dn => (
                    <tr key={dn.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">{dn.noteNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{dn.date}</td>
                      <td className="px-4 py-3 font-sans font-semibold text-slate-800">{dn.supplierName}</td>
                      <td className="px-4 py-3 text-slate-700">{dn.originalBillNumber}</td>
                      <td className="px-4 py-3 font-sans text-slate-600">{dn.reason}</td>
                      <td className="px-4 py-3 text-right">{formatINR(dn.amount)}</td>
                      <td className="px-4 py-3 text-right text-sky-700">{formatINR(dn.gstAmount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatINR(dn.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-sans whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditDebitNote(dn)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit Debit Note"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteModalNote({
                                type: 'debit',
                                id: dn.id,
                                number: dn.noteNumber,
                                entity: dn.supplierName,
                                amount: dn.totalAmount,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Debit Note"
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId
                  ? activeTab === 'credit'
                    ? 'Edit Credit Note'
                    : 'Edit Debit Note'
                  : activeTab === 'credit'
                  ? 'Issue Credit Note (Customer)'
                  : 'Issue Debit Note (Supplier)'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Note Number</label>
                  <input
                    type="text"
                    required
                    value={noteNumber}
                    onChange={e => setNoteNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {activeTab === 'credit' ? 'Customer' : 'Supplier'}
                </label>
                <select
                  value={entityId}
                  onChange={e => {
                    setEntityId(e.target.value);
                    setOriginalDocId('');
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  {activeTab === 'credit'
                    ? state.customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.companyName || c.name}
                        </option>
                      ))
                    : state.suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.companyName || s.name}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Linked Original {activeTab === 'credit' ? 'Invoice' : 'Bill'}
                </label>
                <select
                  value={originalDocId}
                  onChange={e => setOriginalDocId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  <option value="">-- General Account Adjustment --</option>
                  {activeTab === 'credit'
                    ? state.invoices
                        .filter(i => i.customerId === entityId)
                        .map(i => (
                          <option key={i.id} value={i.id}>
                            {i.invoiceNumber} (Total: {formatINR(i.totalAmount)})
                          </option>
                        ))
                    : state.purchases
                        .filter(p => p.supplierId === entityId)
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.billNumber} (Total: {formatINR(p.totalAmount)})
                          </option>
                        ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason for issuance</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Taxable Amount (₹)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={amount}
                    onChange={e => handleAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Tax (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={gstAmount}
                    onChange={e => setGstAmount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border flex justify-between font-bold text-slate-900 font-mono">
                <span>Total Note Amount:</span>
                <span>{formatINR(totalAmount)}</span>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingId ? 'Update Note' : 'Issue Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete {deleteModalNote.type === 'credit' ? 'Credit Note' : 'Debit Note'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{deleteModalNote.number}</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete note{' '}
              <strong className="text-slate-900 font-mono">{deleteModalNote.number}</strong> for{' '}
              <strong className="text-slate-900">{deleteModalNote.entity}</strong> (Total:{' '}
              <strong className="text-slate-900 font-mono">{formatINR(deleteModalNote.amount)}</strong>)?
              Party accounts will be adjusted accordingly.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalNote(null)}
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
