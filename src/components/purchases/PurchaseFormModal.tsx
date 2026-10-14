import React, { useEffect, useState } from 'react';
import { AlertCircle, FileText, Plus, Trash2, Upload, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, PurchaseBill, PurchaseItem, UnitType } from '../../types';
import { calculateGST, formatINR, INDIAN_STATES } from '../../utils/indianGST';

interface PurchaseFormModalProps {
  initialBill?: PurchaseBill | null;
  onClose: () => void;
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({ initialBill, onClose }) => {
  const { state, savePurchase, getNextPurchaseNumber, showToast } = useApp();
  const bSettings = state.settings;

  const [billNumber, setBillNumber] = useState<string>('');
  const [vendorBillNumber, setVendorBillNumber] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10));

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierGstin, setSupplierGstin] = useState<string>('');
  const [supplierState, setSupplierState] = useState<string>(bSettings.state);
  const [supplierStateCode, setSupplierStateCode] = useState<string>(bSettings.stateCode);

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Attachment upload
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentData, setAttachmentData] = useState<string>('');

  // Payment
  const [recordPaymentNow, setRecordPaymentNow] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentAccountId, setPaymentAccountId] = useState<string>(state.accounts[0]?.id || '');

  const [formError, setFormError] = useState<string>('');

  const isInterstate = supplierStateCode !== bSettings.stateCode;

  useEffect(() => {
    if (initialBill) {
      setBillNumber(initialBill.billNumber);
      setVendorBillNumber(initialBill.vendorBillNumber || '');
      setPurchaseDate(initialBill.purchaseDate);
      setDueDate(initialBill.dueDate);
      setSelectedSupplierId(initialBill.supplierId);
      setSupplierName(initialBill.supplierName);
      setSupplierGstin(initialBill.supplierGstin);
      setSupplierState(initialBill.supplierState);
      setSupplierStateCode(initialBill.supplierStateCode);
      setItems(initialBill.items);
      setNotes(initialBill.notes || '');
      setAttachmentName(initialBill.attachmentName || '');
      setAttachmentData(initialBill.attachmentData || '');
    } else {
      setBillNumber(getNextPurchaseNumber());
      if (state.suppliers.length > 0) {
        handleSupplierSelect(state.suppliers[0].id);
      }
      addItem();
    }
  }, [initialBill]);

  const handleSupplierSelect = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = state.suppliers.find(s => s.id === supId);
    if (sup) {
      setSupplierName(sup.companyName || sup.name);
      setSupplierGstin(sup.gstin || '');
      setSupplierState(sup.state);
      setSupplierStateCode(sup.stateCode);

      const newInterstate = sup.stateCode !== bSettings.stateCode;
      setItems(prev =>
        prev.map(it => {
          const gst = calculateGST(it.taxableAmount, it.gstRate, newInterstate, it.cessRate);
          return {
            ...it,
            cgstAmount: gst.cgstAmount,
            sgstAmount: gst.sgstAmount,
            igstAmount: gst.igstAmount,
            totalAmount: gst.totalAmount,
          };
        })
      );
    }
  };

  const addItem = () => {
    const defaultProduct = state.products[0];
    const unit: UnitType = defaultProduct ? defaultProduct.unit : 'PCS';
    const rate = defaultProduct ? defaultProduct.purchasePrice : 800;
    const gstRate = defaultProduct ? defaultProduct.gstRate : bSettings.defaultGstRate;
    const qty = 1;
    const taxable = qty * rate;

    const gst = calculateGST(taxable, gstRate, isInterstate, 0);

    const newItem: PurchaseItem = {
      id: `PITEM-${Date.now()}-${Math.random()}`,
      productId: defaultProduct ? defaultProduct.id : '',
      productName: defaultProduct ? defaultProduct.name : '',
      hsnSac: defaultProduct ? defaultProduct.hsnSac : '8471',
      quantity: qty,
      unit,
      purchaseRate: rate,
      discount: 0,
      taxableAmount: taxable,
      gstRate,
      cgstAmount: gst.cgstAmount,
      sgstAmount: gst.sgstAmount,
      igstAmount: gst.igstAmount,
      cessRate: 0,
      cessAmount: 0,
      totalAmount: gst.totalAmount,
    };

    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) {
      showToast('At least one item is required in a purchase bill', 'info');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItemProduct = (index: number, productId: string) => {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    setItems(prev => {
      const copy = [...prev];
      const it = copy[index];
      const rate = prod.purchasePrice;
      const gstRate = prod.gstRate;
      const taxable = Math.max(0, it.quantity * rate - it.discount);
      const gst = calculateGST(taxable, gstRate, isInterstate, it.cessRate);

      copy[index] = {
        ...it,
        productId: prod.id,
        productName: prod.name,
        hsnSac: prod.hsnSac,
        unit: prod.unit,
        purchaseRate: rate,
        gstRate,
        taxableAmount: taxable,
        cgstAmount: gst.cgstAmount,
        sgstAmount: gst.sgstAmount,
        igstAmount: gst.igstAmount,
        totalAmount: gst.totalAmount,
      };
      return copy;
    });
  };

  const updateItemField = (index: number, field: keyof PurchaseItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const it = { ...copy[index], [field]: value };

      const gross = (Number(it.quantity) || 0) * (Number(it.purchaseRate) || 0);
      const taxable = Math.max(0, gross - (Number(it.discount) || 0));
      const gst = calculateGST(taxable, Number(it.gstRate) || 0, isInterstate, Number(it.cessRate) || 0);

      copy[index] = {
        ...it,
        taxableAmount: taxable,
        cgstAmount: gst.cgstAmount,
        sgstAmount: gst.sgstAmount,
        igstAmount: gst.igstAmount,
        cessAmount: gst.cessAmount,
        totalAmount: gst.totalAmount,
      };
      return copy;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error');
      return;
    }

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Aggregates
  const taxableAmount = items.reduce((acc, it) => acc + it.taxableAmount, 0);
  const cgstTotal = items.reduce((acc, it) => acc + it.cgstAmount, 0);
  const sgstTotal = items.reduce((acc, it) => acc + it.sgstAmount, 0);
  const igstTotal = items.reduce((acc, it) => acc + it.igstAmount, 0);
  const cessTotal = items.reduce((acc, it) => acc + it.cessAmount, 0);
  const rawTotal = taxableAmount + cgstTotal + sgstTotal + igstTotal + cessTotal;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const totalAmount = Math.round(rawTotal);

  useEffect(() => {
    if (recordPaymentNow && paymentAmount === 0) {
      setPaymentAmount(totalAmount);
    }
  }, [totalAmount, recordPaymentNow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!billNumber.trim()) {
      setFormError('Purchase Bill number is required');
      return;
    }

    if (!supplierName.trim()) {
      setFormError('Please select or specify a supplier');
      return;
    }

    if (items.length === 0 || items.some(it => it.quantity <= 0 || it.purchaseRate < 0)) {
      setFormError('Please ensure all items have valid quantity and price');
      return;
    }

    const newBill: PurchaseBill = {
      id: initialBill ? initialBill.id : `PUR-${Date.now()}`,
      billNumber: billNumber.trim(),
      vendorBillNumber: vendorBillNumber.trim(),
      purchaseDate,
      dueDate,
      supplierId: selectedSupplierId || 'SUP-DIRECT',
      supplierName: supplierName.trim(),
      supplierGstin: supplierGstin.trim().toUpperCase(),
      supplierState,
      supplierStateCode,
      isInterstate,
      items,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      cessTotal,
      roundOff,
      totalAmount,
      amountPaid: initialBill ? initialBill.amountPaid : 0,
      balanceDue: initialBill ? Math.max(0, totalAmount - initialBill.amountPaid) : totalAmount,
      paymentStatus: initialBill ? initialBill.paymentStatus : 'Unpaid',
      attachmentName,
      attachmentData,
      notes,
      createdAt: initialBill ? initialBill.createdAt : purchaseDate,
    };

    savePurchase(
      newBill,
      recordPaymentNow && paymentAmount > 0
        ? {
            amount: paymentAmount,
            method: paymentMethod,
            accountId: paymentAccountId,
          }
        : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{initialBill ? 'Edit Purchase Bill' : 'Record Purchase Bill (Inward Supply)'}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-900/80 text-blue-200 border border-blue-700 font-mono">
                {isInterstate ? 'Interstate (Input IGST)' : 'Intrastate (Input CGST+SGST)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Stock will be incremented automatically & input tax credit recorded
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Bill numbers, Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Internal Bill Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Supplier's Bill / Invoice #</label>
              <input
                type="text"
                value={vendorBillNumber}
                onChange={e => setVendorBillNumber(e.target.value)}
                placeholder="e.g. ZS/MH/8821"
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Purchase Date</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Section 2: Supplier Selection */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Supplier (Vendor) Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => handleSupplierSelect(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white"
                >
                  <option value="">-- Choose Existing Supplier --</option>
                  {state.suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.companyName || s.name} ({s.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Supplier GSTIN</label>
                <input
                  type="text"
                  maxLength={15}
                  value={supplierGstin}
                  onChange={e => setSupplierGstin(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white uppercase"
                  placeholder="27AABCZ1122S1Z4"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Purchased Items Table */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Purchased Items & Inventory Stock</span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2 w-48">Product / Stock Item</th>
                    <th className="p-2 w-24">HSN/SAC</th>
                    <th className="p-2 w-16 text-center">Qty</th>
                    <th className="p-2 w-20">Unit</th>
                    <th className="p-2 w-24 text-right">Cost (₹)</th>
                    <th className="p-2 w-28 text-right">Taxable</th>
                    <th className="p-2 w-20 text-center">GST %</th>
                    <th className="p-2 w-28 text-right">Total (₹)</th>
                    <th className="p-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <select
                          value={item.productId}
                          onChange={e => updateItemProduct(idx, e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-slate-900 bg-white"
                        >
                          <option value="">-- Custom Item --</option>
                          {state.products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={e => updateItemField(idx, 'productName', e.target.value)}
                          placeholder="Description"
                          className="w-full border border-slate-200 rounded-md px-2 py-1 mt-1 text-[11px]"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={e => updateItemField(idx, 'hsnSac', e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 font-mono text-center text-slate-900 bg-white"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={e => updateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-center font-mono text-slate-900 bg-white"
                        />
                      </td>

                      <td className="p-2">
                        <select
                          value={item.unit}
                          onChange={e => updateItemField(idx, 'unit', e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-slate-800 bg-white"
                        >
                          {(['PCS', 'NOS', 'KG', 'MTR', 'BOX', 'SET', 'HOURS', 'PKT', 'LTR'] as UnitType[]).map(u => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.purchaseRate}
                          onChange={e => updateItemField(idx, 'purchaseRate', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-right font-mono text-slate-900 bg-white"
                        />
                      </td>

                      <td className="p-2 text-right font-mono font-medium text-slate-800">
                        {formatINR(item.taxableAmount, false)}
                      </td>

                      <td className="p-2 text-center">
                        <select
                          value={item.gstRate}
                          onChange={e => updateItemField(idx, 'gstRate', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-center font-mono text-slate-900 bg-white"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>

                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.totalAmount, false)}
                      </td>

                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Attachments & Tax summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attachment & Notes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Upload Bill Attachment (PDF / JPG / PNG)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {attachmentName && (
                    <span className="font-mono text-slate-600 truncate max-w-xs">{attachmentName}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white text-xs outline-hidden"
                />
              </div>
            </div>

            {/* Calculations breakdown */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Purchases:</span>
                <span>{formatINR(taxableAmount)}</span>
              </div>
              {isInterstate ? (
                <div className="flex justify-between text-sky-400">
                  <span>Input IGST (ITC):</span>
                  <span>{formatINR(igstTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sky-400">
                    <span>Input CGST (ITC):</span>
                    <span>{formatINR(cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sky-400">
                    <span>Input SGST (ITC):</span>
                    <span>{formatINR(sgstTotal)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-bold text-sky-400 border-t-2 border-slate-700 pt-2">
                <span>Total Purchase Bill:</span>
                <span>{formatINR(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Initial Payment */}
          {!initialBill && (
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl text-xs space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recordPurchasePayCheck"
                  checked={recordPaymentNow}
                  onChange={e => setRecordPaymentNow(e.target.checked)}
                  className="rounded-sm border-blue-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="recordPurchasePayCheck"
                  className="font-bold text-blue-950 cursor-pointer select-none"
                >
                  Pay supplier immediately from cash/bank account?
                </label>
              </div>

              {recordPaymentNow && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-200/60">
                  <div>
                    <label className="block text-blue-900 font-semibold mb-1">Amount Paid (₹)</label>
                    <input
                      type="number"
                      max={totalAmount}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-900 font-semibold mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-blue-900 font-semibold mb-1">Debit From Account</label>
                    <select
                      value={paymentAccountId}
                      onChange={e => setPaymentAccountId(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white"
                    >
                      {state.accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatINR(acc.currentBalance)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20"
            >
              {initialBill ? 'Save Changes' : 'Record Purchase Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
