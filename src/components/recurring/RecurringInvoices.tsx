import React, { useState } from 'react';
import { CalendarClock, Play, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RecurringFrequency, RecurringInvoice } from '../../types';
import { formatINR } from '../../utils/indianGST';

export const RecurringInvoices: React.FC = () => {
  const { state, saveRecurring, deleteRecurring, generateRecurringInvoices } = useApp();
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState(state.customers[0]?.id || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>('Monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [productId, setProductId] = useState(state.products[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(state.products[0]?.sellingPrice || 5000);

  const handleRunNow = () => {
    generateRecurringInvoices();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !customerId) return;

    const prod = state.products.find(p => p.id === productId);

    const newRec: RecurringInvoice = {
      id: `REC-${Date.now()}`,
      title: title.trim(),
      customerId,
      frequency,
      startDate,
      nextDate: startDate,
      items: [
        {
          id: `RITEM-${Date.now()}`,
          productId: prod?.id || '',
          productName: prod?.name || 'Recurring Service',
          hsnSac: prod?.hsnSac || '998314',
          quantity: qty,
          unit: prod?.unit || 'HOURS',
          rate,
          discount: 0,
          discountType: 'percentage',
          taxableAmount: qty * rate,
          gstRate: prod?.gstRate || 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessRate: 0,
          cessAmount: 0,
          totalAmount: qty * rate,
        },
      ],
      active: true,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    saveRecurring(newRec);
    setShowModal(false);
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-indigo-600" />
            <span>Recurring Invoice Schedules</span>
          </h3>
          <p className="text-xs text-slate-500">Automate recurring client maintenance and retainer bills</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunNow}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Schedule Now</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Recurring Schedule</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.recurring.map(r => {
          const cust = state.customers.find(c => c.id === r.customerId);
          const totalVal = r.items.reduce((s, it) => s + it.taxableAmount * 1.18, 0);

          return (
            <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  {r.frequency}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    r.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {r.active ? 'Active' : 'Paused'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{r.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {cust?.companyName || cust?.name || 'Customer'}
                </p>
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Estimated Total:</span>
                  <span className="font-bold text-slate-900">{formatINR(totalVal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Next Run:</span>
                  <span>{r.nextDate}</span>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-end">
                <button
                  onClick={() => deleteRecurring(r.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                  title="Delete Schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">New Recurring Invoicing Schedule</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contract / Retainer Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Monthly SCADA Maintenance"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer</label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Billing Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Billed Service / Item</label>
                <select
                  value={productId}
                  onChange={e => {
                    setProductId(e.target.value);
                    const p = state.products.find(pr => pr.id === e.target.value);
                    if (p) setRate(p.sellingPrice);
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  {state.products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={e => setQty(parseInt(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={rate}
                    onChange={e => setRate(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
