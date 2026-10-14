import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  Calendar,
  CheckCircle2,
  FileText,
  IndianRupee,
  Percent,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InvoiceItem, Product, Quotation, QuotationStatus, UnitType } from '../../types';
import {
  calculateGST,
  formatINR,
  GST_RATES,
  INDIAN_STATES,
  validateGSTIN,
} from '../../utils/indianGST';

interface QuotationFormModalProps {
  initialQuotation?: Quotation | null;
  onClose: () => void;
  onSuccess?: (quotation: Quotation) => void;
}

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  initialQuotation,
  onClose,
  onSuccess,
}) => {
  const { state, saveQuotation, getNextQuotationNumber } = useApp();
  const bSettings = state.settings;

  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().substring(0, 10));
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10)
  );
  const [status, setStatus] = useState<QuotationStatus>('Sent');

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerGstin, setCustomerGstin] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerState, setCustomerState] = useState<string>(bSettings.state);
  const [customerStateCode, setCustomerStateCode] = useState<string>(bSettings.stateCode);
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(bSettings.state);
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState<string>(bSettings.stateCode);

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState<string>(
    'Thank you for your inquiry. This quotation is valid for 30 days.'
  );
  const [terms, setTerms] = useState<string>(
    '1. Prices are valid for 30 days from quote date.\n2. Payment terms as agreed.\n3. Goods delivery subject to availability.'
  );
  const [formError, setFormError] = useState<string>('');

  const isInterstate = placeOfSupplyCode !== bSettings.stateCode;

  // Initialize
  useEffect(() => {
    if (initialQuotation) {
      setQuotationNumber(initialQuotation.quotationNumber);
      setQuotationDate(initialQuotation.quotationDate);
      setValidUntil(initialQuotation.validUntil);
      setStatus(initialQuotation.status);
      setSelectedCustomerId(initialQuotation.customerId);
      setCustomerName(initialQuotation.customerName);
      setCustomerGstin(initialQuotation.customerGstin);
      setCustomerAddress(initialQuotation.customerAddress);
      setCustomerState(initialQuotation.customerState);
      setCustomerStateCode(initialQuotation.customerStateCode);
      setPlaceOfSupply(initialQuotation.placeOfSupply);
      setPlaceOfSupplyCode(initialQuotation.placeOfSupplyCode);
      setItems(initialQuotation.items);
      setNotes(initialQuotation.notes);
      setTerms(initialQuotation.termsAndConditions);
    } else {
      setQuotationNumber(getNextQuotationNumber());
      if (state.customers.length > 0) {
        handleCustomerSelect(state.customers[0].id);
      }
      addItem();
    }
  }, [initialQuotation]);

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = state.customers.find(c => c.id === custId);
    if (cust) {
      setCustomerName(cust.companyName || cust.name);
      setCustomerGstin(cust.gstin || '');
      setCustomerAddress(cust.billingAddress || '');
      setCustomerState(cust.state);
      setCustomerStateCode(cust.stateCode);
      setPlaceOfSupply(cust.state);
      setPlaceOfSupplyCode(cust.stateCode);

      const newInterstate = cust.stateCode !== bSettings.stateCode;
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

  const handlePlaceOfSupplyChange = (code: string) => {
    const st = INDIAN_STATES.find(s => s.code === code);
    if (!st) return;
    setPlaceOfSupply(st.name);
    setPlaceOfSupplyCode(st.code);

    const newInterstate = code !== bSettings.stateCode;
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
  };

  // Line Item Operations
  const addItem = () => {
    const defaultProduct = state.products[0];
    const unit: UnitType = defaultProduct ? defaultProduct.unit : 'PCS';
    const rate = defaultProduct ? defaultProduct.sellingPrice : 1000;
    const gstRate = defaultProduct ? defaultProduct.gstRate : 18;
    const taxable = rate;
    const tax = calculateGST(taxable, gstRate, isInterstate);

    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: defaultProduct ? defaultProduct.id : '',
      productName: defaultProduct ? defaultProduct.name : 'Agricultural Goods',
      hsnSac: defaultProduct ? defaultProduct.hsnSac : '3101',
      quantity: 1,
      unit,
      rate,
      discount: 0,
      discountType: 'percentage',
      taxableAmount: taxable,
      gstRate,
      cgstAmount: tax.cgstAmount,
      sgstAmount: tax.sgstAmount,
      igstAmount: tax.igstAmount,
      cessRate: 0,
      cessAmount: 0,
      totalAmount: tax.totalAmount,
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemProduct = (index: number, prodId: string) => {
    const prod = state.products.find(p => p.id === prodId);
    if (!prod) return;

    setItems(prev => {
      const updated = [...prev];
      const it = updated[index];
      const rate = prod.sellingPrice;
      const discountVal = it.discountType === 'percentage' ? (it.quantity * rate * it.discount) / 100 : it.discount;
      const taxable = Math.max(0, it.quantity * rate - discountVal);
      const tax = calculateGST(taxable, prod.gstRate, isInterstate, it.cessRate || 0);

      updated[index] = {
        ...it,
        productId: prod.id,
        productName: prod.name,
        hsnSac: prod.hsnSac,
        unit: prod.unit,
        rate,
        gstRate: prod.gstRate,
        taxableAmount: taxable,
        cgstAmount: tax.cgstAmount,
        sgstAmount: tax.sgstAmount,
        igstAmount: tax.igstAmount,
        totalAmount: tax.totalAmount,
      };
      return updated;
    });
  };

  const updateItemField = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const it = { ...updated[index], [field]: value };

      const qty = field === 'quantity' ? Number(value) : it.quantity;
      const rate = field === 'rate' ? Number(value) : it.rate;
      const disc = field === 'discount' ? Number(value) : it.discount;
      const gstRate = field === 'gstRate' ? Number(value) : it.gstRate;
      const cessRate = field === 'cessRate' ? Number(value) : it.cessRate;

      const gross = qty * rate;
      const discAmt = it.discountType === 'percentage' ? (gross * disc) / 100 : disc;
      const taxable = Math.max(0, gross - discAmt);
      const tax = calculateGST(taxable, gstRate, isInterstate, cessRate);

      updated[index] = {
        ...it,
        quantity: qty,
        rate,
        discount: disc,
        taxableAmount: taxable,
        gstRate,
        cessRate,
        cgstAmount: tax.cgstAmount,
        sgstAmount: tax.sgstAmount,
        igstAmount: tax.igstAmount,
        cessAmount: tax.cessAmount,
        totalAmount: tax.totalAmount,
      };
      return updated;
    });
  };

  // Aggregations
  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
  const discountTotal = items.reduce((sum, it) => {
    const gross = it.quantity * it.rate;
    const d = it.discountType === 'percentage' ? (gross * it.discount) / 100 : it.discount;
    return sum + d;
  }, 0);
  const taxableAmount = items.reduce((sum, it) => sum + it.taxableAmount, 0);
  const cgstTotal = items.reduce((sum, it) => sum + it.cgstAmount, 0);
  const sgstTotal = items.reduce((sum, it) => sum + it.sgstAmount, 0);
  const igstTotal = items.reduce((sum, it) => sum + it.igstAmount, 0);
  const cessTotal = items.reduce((sum, it) => sum + it.cessAmount, 0);
  const rawTotal = taxableAmount + cgstTotal + sgstTotal + igstTotal + cessTotal;
  const roundedTotal = Math.round(rawTotal);
  const roundOff = Number((roundedTotal - rawTotal).toFixed(2));
  const totalAmount = roundedTotal;

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!quotationNumber.trim()) {
      setFormError('Please enter a quotation number');
      return;
    }

    const isDup = (state.quotations || []).some(
      q =>
        q.quotationNumber.toLowerCase() === quotationNumber.trim().toLowerCase() &&
        q.id !== initialQuotation?.id
    );
    if (isDup) {
      setFormError(`Quotation number "${quotationNumber}" already exists.`);
      return;
    }

    if (!customerName.trim()) {
      setFormError('Please select or specify a customer');
      return;
    }

    if (items.length === 0 || items.some(it => it.quantity <= 0 || it.rate < 0)) {
      setFormError('Please ensure all items have valid positive quantity and rate');
      return;
    }

    if (customerGstin.trim()) {
      const gstinVal = validateGSTIN(customerGstin);
      if (!gstinVal.isValid) {
        setFormError(`Invalid Customer GSTIN: ${gstinVal.error}`);
        return;
      }
    }

    const newQuotation: Quotation = {
      id: initialQuotation ? initialQuotation.id : `QUOTE-${Date.now()}`,
      quotationNumber: quotationNumber.trim(),
      quotationDate,
      validUntil,
      status: initialQuotation ? initialQuotation.status : status,
      customerId: selectedCustomerId || 'CUST-WALKIN',
      customerName: customerName.trim(),
      customerGstin: customerGstin.trim().toUpperCase(),
      customerAddress: customerAddress.trim(),
      customerState,
      customerStateCode,
      placeOfSupply,
      placeOfSupplyCode,
      isInterstate,
      items,
      subtotal,
      discountTotal,
      taxableAmount,
      cgstTotal,
      sgstTotal,
      igstTotal,
      cessTotal,
      roundOff,
      totalAmount,
      notes,
      termsAndConditions: terms,
      convertedInvoiceId: initialQuotation?.convertedInvoiceId,
      convertedInvoiceNumber: initialQuotation?.convertedInvoiceNumber,
      createdAt: initialQuotation ? initialQuotation.createdAt : new Date().toISOString(),
    };

    saveQuotation(newQuotation);
    if (onSuccess) {
      onSuccess(newQuotation);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{initialQuotation ? 'Edit Quotation / Estimate' : 'New Quotation / Estimate'}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-900/80 text-amber-200 border border-amber-700 font-mono">
                {isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sales estimate and quotation for {bSettings.tradeName || 'mr.farmercorp'}
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

          {/* Section 1: Numbering, Dates, Place of Supply, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Quotation Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={quotationNumber}
                onChange={e => setQuotationNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                placeholder="QT/2026-27/0101"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Quotation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={e => setQuotationDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={e => setValidUntil(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white font-mono focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as QuotationStatus)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Converted">Converted</option>
                <option value="Expired">Expired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Place of Supply</label>
              <select
                value={placeOfSupplyCode}
                onChange={e => handlePlaceOfSupplyChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Customer Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Customer / Recipient Details</span>
              <span className="text-slate-500 text-[11px]">Select from contacts or enter details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerSelect(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="">-- Manual Customer Entry --</option>
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Customer / Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  placeholder="e.g. Apex Agri Solutions"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  GSTIN (Leave blank if Unregistered)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={customerGstin}
                  onChange={e => setCustomerGstin(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono uppercase text-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  placeholder="33AAAAA0000A1Z5"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Billing & Delivery Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                placeholder="Door No, Street, Landmark, City & Pincode"
              />
            </div>
          </div>

          {/* Section 3: Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">Line Items & Quotation Estimation</span>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white text-[10px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-2.5 w-8 text-center">#</th>
                      <th className="p-2.5 min-w-[200px]">Product / Service</th>
                      <th className="p-2.5 w-24">HSN/SAC</th>
                      <th className="p-2.5 w-20">Qty</th>
                      <th className="p-2.5 w-20">UOM</th>
                      <th className="p-2.5 w-28">Rate (₹)</th>
                      <th className="p-2.5 w-20">Disc %</th>
                      <th className="p-2.5 w-24 text-right">Taxable (₹)</th>
                      <th className="p-2.5 w-24">GST %</th>
                      <th className="p-2.5 w-28 text-right">Total (₹)</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Product / Description */}
                        <td className="p-2">
                          <select
                            value={item.productId}
                            onChange={e => updateItemProduct(index, e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs mb-1 font-semibold text-slate-800 bg-white"
                          >
                            <option value="">-- Custom Item --</option>
                            {state.products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock} {p.unit})
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={item.productName}
                            onChange={e => updateItemField(index, 'productName', e.target.value)}
                            placeholder="Description / Name"
                            className="w-full border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700"
                          />
                        </td>

                        {/* HSN */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.hsnSac}
                            onChange={e => updateItemField(index, 'hsnSac', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                            placeholder="3101"
                          />
                        </td>

                        {/* Qty */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={e => updateItemField(index, 'quantity', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                          />
                        </td>

                        {/* Unit */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => updateItemField(index, 'unit', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 uppercase font-mono text-xs"
                          />
                        </td>

                        {/* Rate */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={e => updateItemField(index, 'rate', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs font-semibold text-slate-900"
                          />
                        </td>

                        {/* Discount % */}
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={e => updateItemField(index, 'discount', e.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                          />
                        </td>

                        {/* Taxable */}
                        <td className="p-2 text-right font-mono font-medium text-slate-800">
                          {formatINR(item.taxableAmount)}
                        </td>

                        {/* GST Rate */}
                        <td className="p-2">
                          <select
                            value={item.gstRate}
                            onChange={e => updateItemField(index, 'gstRate', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"
                          >
                            {GST_RATES.map(r => (
                              <option key={r} value={r}>
                                {r}%
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Total */}
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {formatINR(item.totalAmount)}
                        </td>

                        {/* Delete Item */}
                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 4: Notes & Summary Calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quotation Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 font-mono text-[11px] outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross):</span>
                <span className="font-mono">{formatINR(subtotal)}</span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-mono">-{formatINR(discountTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-200">
                <span>Taxable Value:</span>
                <span className="font-mono">{formatINR(taxableAmount)}</span>
              </div>

              {!isInterstate ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central Tax (CGST):</span>
                    <span className="font-mono text-slate-800">{formatINR(cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State Tax (SGST):</span>
                    <span className="font-mono text-slate-800">{formatINR(sgstTotal)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated Tax (IGST):</span>
                  <span className="font-mono text-slate-800">{formatINR(igstTotal)}</span>
                </div>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">
                    {roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 text-slate-900 font-bold text-base">
                <span>Estimated Total:</span>
                <span className="font-mono text-xl">{formatINR(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialQuotation ? 'Update Quotation' : 'Save Quotation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
