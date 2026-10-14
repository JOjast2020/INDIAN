import React, { useEffect, useState } from 'react';
import { AlertCircle, FileUp, IndianRupee, Paperclip, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Invoice, InvoiceItem, PaymentMethod, UnitType } from '../../types';
import {
  calculateGST,
  formatINR,
  getFinancialYear,
  INDIAN_STATES,
  numberToWordsINR,
  validateGSTIN,
} from '../../utils/indianGST';

interface InvoiceFormModalProps {
  initialInvoice?: Invoice | null;
  onClose: () => void;
}

export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({ initialInvoice, onClose }) => {
  const { state, saveInvoice, getNextInvoiceNumber, showToast } = useApp();
  const bSettings = state.settings;

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10)
  );

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerGstin, setCustomerGstin] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerState, setCustomerState] = useState<string>(bSettings.state);
  const [customerStateCode, setCustomerStateCode] = useState<string>(bSettings.stateCode);
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(bSettings.state);
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState<string>(bSettings.stateCode);
  const [reverseCharge, setReverseCharge] = useState<boolean>(false);

  // Line Items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Notes & Terms
  const [notes, setNotes] = useState<string>(bSettings.defaultNotes);
  const [terms, setTerms] = useState<string>(bSettings.defaultPaymentTerms);

  // Attachment (PDF / Image scan)
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentData, setAttachmentData] = useState<string>('');
  const [isImported, setIsImported] = useState<boolean>(false);

  // Initial Payment
  const [recordPaymentNow, setRecordPaymentNow] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentAccountId, setPaymentAccountId] = useState<string>(
    state.accounts[0]?.id || ''
  );

  const [formError, setFormError] = useState<string>('');

  // Auto determine interstate flag
  const isInterstate = placeOfSupplyCode !== bSettings.stateCode;

  // Initialize form
  useEffect(() => {
    if (initialInvoice) {
      setInvoiceNumber(initialInvoice.invoiceNumber);
      setInvoiceDate(initialInvoice.invoiceDate);
      setDueDate(initialInvoice.dueDate);
      setSelectedCustomerId(initialInvoice.customerId);
      setCustomerName(initialInvoice.customerName);
      setCustomerGstin(initialInvoice.customerGstin);
      setCustomerAddress(initialInvoice.customerAddress);
      setCustomerState(initialInvoice.customerState);
      setCustomerStateCode(initialInvoice.customerStateCode);
      setPlaceOfSupply(initialInvoice.placeOfSupply);
      setPlaceOfSupplyCode(initialInvoice.placeOfSupplyCode);
      setReverseCharge(initialInvoice.reverseCharge);
      setItems(initialInvoice.items);
      setNotes(initialInvoice.notes);
      setTerms(initialInvoice.termsAndConditions);
      if (initialInvoice.attachmentName) setAttachmentName(initialInvoice.attachmentName);
      if (initialInvoice.attachmentData) setAttachmentData(initialInvoice.attachmentData);
      if (initialInvoice.isImported) setIsImported(initialInvoice.isImported);
    } else {
      setInvoiceNumber(getNextInvoiceNumber());
      // Default with first customer if available
      if (state.customers.length > 0) {
        handleCustomerSelect(state.customers[0].id);
      }
      // Default with 1 empty item
      addItem();
    }
  }, [initialInvoice]);

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setFormError('Attachment file size exceeds 15MB limit.');
      return;
    }
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachmentName('');
    setAttachmentData('');
  };

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

      // Recalculate existing items with new state/tax structure
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

  const addItem = () => {
    const defaultProduct = state.products[0];
    const unit: UnitType = defaultProduct ? defaultProduct.unit : 'PCS';
    const rate = defaultProduct ? defaultProduct.sellingPrice : 1000;
    const gstRate = defaultProduct ? defaultProduct.gstRate : bSettings.defaultGstRate;
    const qty = 1;
    const taxable = qty * rate;

    const gst = calculateGST(taxable, gstRate, isInterstate, 0);

    const newItem: InvoiceItem = {
      id: `ITEM-${Date.now()}-${Math.random()}`,
      productId: defaultProduct ? defaultProduct.id : '',
      productName: defaultProduct ? defaultProduct.name : '',
      hsnSac: defaultProduct ? defaultProduct.hsnSac : '8471',
      quantity: qty,
      unit,
      rate,
      discount: 0,
      discountType: 'percentage',
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

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      showToast('An invoice must have at least one line item', 'info');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemProduct = (index: number, productId: string) => {
    const prod = state.products.find(p => p.id === productId);
    if (!prod) return;

    setItems(prev => {
      const copy = [...prev];
      const it = copy[index];
      const rate = prod.sellingPrice;
      const gstRate = prod.gstRate;
      const taxable = it.quantity * rate - (it.discountType === 'percentage' ? (it.quantity * rate * it.discount) / 100 : it.discount);
      const safeTaxable = Math.max(0, taxable);
      const gst = calculateGST(safeTaxable, gstRate, isInterstate, it.cessRate);

      copy[index] = {
        ...it,
        productId: prod.id,
        productName: prod.name,
        hsnSac: prod.hsnSac,
        unit: prod.unit,
        rate,
        gstRate,
        taxableAmount: safeTaxable,
        cgstAmount: gst.cgstAmount,
        sgstAmount: gst.sgstAmount,
        igstAmount: gst.igstAmount,
        totalAmount: gst.totalAmount,
      };
      return copy;
    });
  };

  const updateItemField = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      const it = { ...copy[index], [field]: value };

      // recalculate taxable
      const gross = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
      let discVal = Number(it.discount) || 0;
      if (it.discountType === 'percentage') {
        discVal = (gross * discVal) / 100;
      }
      const taxable = Math.max(0, gross - discVal);
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

  // Aggregates
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.rate), 0);
  const taxableAmount = items.reduce((acc, it) => acc + it.taxableAmount, 0);
  const discountTotal = Math.max(0, subtotal - taxableAmount);
  const cgstTotal = items.reduce((acc, it) => acc + it.cgstAmount, 0);
  const sgstTotal = items.reduce((acc, it) => acc + it.sgstAmount, 0);
  const igstTotal = items.reduce((acc, it) => acc + it.igstAmount, 0);
  const cessTotal = items.reduce((acc, it) => acc + it.cessAmount, 0);
  const rawTotal = taxableAmount + cgstTotal + sgstTotal + igstTotal + cessTotal;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const totalAmount = Math.round(rawTotal);

  // Update payment amount if auto full pay
  useEffect(() => {
    if (recordPaymentNow && paymentAmount === 0) {
      setPaymentAmount(totalAmount);
    }
  }, [totalAmount, recordPaymentNow]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!invoiceNumber.trim()) {
      setFormError('Invoice number is required');
      return;
    }

    // Check duplicate
    const isDup = state.invoices.some(
      inv => inv.invoiceNumber.toLowerCase() === invoiceNumber.trim().toLowerCase() && inv.id !== initialInvoice?.id
    );
    if (isDup) {
      setFormError(`Invoice number "${invoiceNumber}" already exists. Please choose a unique number.`);
      return;
    }

    if (!customerName.trim()) {
      setFormError('Please select or specify a customer');
      return;
    }

    if (items.length === 0 || items.some(it => it.quantity <= 0 || it.rate < 0)) {
      setFormError('Please ensure all line items have valid quantity and price');
      return;
    }

    // Customer GSTIN format check if entered
    if (customerGstin.trim()) {
      const gstinVal = validateGSTIN(customerGstin);
      if (!gstinVal.isValid) {
        setFormError(`Invalid Customer GSTIN: ${gstinVal.error}`);
        return;
      }
    }

    const newInvoice: Invoice = {
      id: initialInvoice ? initialInvoice.id : `INV-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      customerId: selectedCustomerId || 'CUST-WALKIN',
      customerName: customerName.trim(),
      customerGstin: customerGstin.trim().toUpperCase(),
      customerAddress: customerAddress.trim(),
      customerState,
      customerStateCode,
      placeOfSupply,
      placeOfSupplyCode,
      isInterstate,
      reverseCharge,
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
      amountPaid: initialInvoice ? initialInvoice.amountPaid : 0,
      balanceDue: initialInvoice ? Math.max(0, totalAmount - initialInvoice.amountPaid) : totalAmount,
      paymentStatus: initialInvoice ? initialInvoice.paymentStatus : 'Unpaid',
      attachmentName: attachmentName || initialInvoice?.attachmentName,
      attachmentData: attachmentData || initialInvoice?.attachmentData,
      isImported: isImported || initialInvoice?.isImported || false,
      notes,
      termsAndConditions: terms,
      createdAt: initialInvoice ? initialInvoice.createdAt : invoiceDate,
    };

    saveInvoice(
      newInvoice,
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
              <span>{initialInvoice ? 'Edit Tax Invoice' : 'Create GST Tax Invoice'}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-900/80 text-indigo-200 border border-indigo-700 font-mono">
                {isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Goods & Services Tax billing adhering to Indian GST format
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

          {/* Section 1: Numbering, Dates, Place of Supply */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            {/* Invoice Number */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Invoice Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="INV/2026-27/0101"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique invoice reference</span>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white font-mono focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {/* Place of Supply */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Place of Supply (State)</label>
              <select
                value={placeOfSupplyCode}
                onChange={e => handlePlaceOfSupplyChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {isInterstate ? 'Interstate (IGST applicable)' : 'Intrastate (CGST + SGST applicable)'}
              </span>
            </div>
          </div>

          {/* Section 2: Customer Selection & Details */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Customer (Billed To) Details</span>
              <span className="text-slate-500 text-[11px]">Select from master or edit details below</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Customer Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerSelect(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.name} ({c.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer / Company Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  placeholder="e.g. Apex Infotech Solutions"
                />
              </div>

              {/* Customer GSTIN */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer GSTIN (15 Digits)</label>
                <input
                  type="text"
                  maxLength={15}
                  value={customerGstin}
                  onChange={e => {
                    const clean = e.target.value.toUpperCase();
                    setCustomerGstin(clean);
                    if (clean.length === 15) {
                      const res = validateGSTIN(clean);
                      if (res.isValid && res.stateCode) {
                        handlePlaceOfSupplyChange(res.stateCode);
                      }
                    }
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white uppercase focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  placeholder="27AABCA5678B1Z1 (Leave blank if unregistered)"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Billing & Delivery Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="Unit, Street, Area, City, State - Pincode"
              />
            </div>
          </div>

          {/* Section 3: Line Items Table */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Line Items & Products / Services</span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-2 w-48">Product / Service</th>
                    <th className="p-2 w-24">HSN/SAC</th>
                    <th className="p-2 w-16 text-center">Qty</th>
                    <th className="p-2 w-20">Unit</th>
                    <th className="p-2 w-24 text-right">Rate (₹)</th>
                    <th className="p-2 w-20 text-center">Disc (%)</th>
                    <th className="p-2 w-28 text-right">Taxable</th>
                    <th className="p-2 w-24 text-center">GST %</th>
                    <th className="p-2 w-28 text-right">Total (₹)</th>
                    <th className="p-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      {/* Product Selector / Input */}
                      <td className="p-2">
                        <select
                          value={item.productId}
                          onChange={e => updateItemProduct(idx, e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-slate-900 bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden"
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
                          placeholder="Item Description"
                          className="w-full border border-slate-200 rounded-md px-2 py-1 mt-1 text-[11px] text-slate-700 bg-slate-50/50"
                        />
                      </td>

                      {/* HSN/SAC */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={e => updateItemField(idx, 'hsnSac', e.target.value)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 font-mono text-center text-slate-900 bg-white"
                          placeholder="8471"
                        />
                      </td>

                      {/* Quantity */}
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

                      {/* Unit */}
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

                      {/* Rate */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={e => updateItemField(idx, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-right font-mono text-slate-900 bg-white"
                        />
                      </td>

                      {/* Discount % */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={e => updateItemField(idx, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-md px-2 py-1 text-center font-mono text-slate-900 bg-white"
                          placeholder="0"
                        />
                      </td>

                      {/* Taxable Amount */}
                      <td className="p-2 text-right font-mono font-medium text-slate-800">
                        {formatINR(item.taxableAmount, false)}
                      </td>

                      {/* GST Rate */}
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

                      {/* Total */}
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.totalAmount, false)}
                      </td>

                      {/* Remove Button */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                          title="Remove Line Item"
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

          {/* Section 4: Calculations Summary & Amount in Words */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount In Words & Terms */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Amount in Words:</span>
                <p className="font-bold text-slate-900 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  {numberToWordsINR(totalAmount)}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Customer Notes / Memo</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white text-xs outline-hidden"
                  placeholder="Notes shown on invoice..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-800 bg-white text-xs outline-hidden"
                />
              </div>

              {/* Invoice Document Attachment (Old invoice PDF / Scan) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Attach Invoice Document / Old PDF (Optional)</span>
                  </span>
                  {attachmentName && (
                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="text-[11px] text-rose-600 hover:underline font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {attachmentName ? (
                  <div className="flex items-center justify-between p-2 bg-indigo-50/70 border border-indigo-200 rounded-lg text-indigo-900 text-xs font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <FileUp className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="truncate">{attachmentName}</span>
                    </div>
                    <span className="text-[10px] text-indigo-700 font-sans font-semibold bg-indigo-100 px-1.5 py-0.5 rounded">
                      Attached
                    </span>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-lg cursor-pointer bg-white transition-colors">
                    <FileUp className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 text-xs">Upload old invoice PDF or scan image</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleAttachmentUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Tax Computation Breakdown */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal (Gross):</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>-{formatINR(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-100 border-t border-slate-800 pt-1.5">
                <span>Taxable Amount:</span>
                <span>{formatINR(taxableAmount)}</span>
              </div>

              {isInterstate ? (
                <div className="flex justify-between text-sky-400">
                  <span>Integrated GST (IGST):</span>
                  <span>{formatINR(igstTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sky-400">
                    <span>Central GST (CGST):</span>
                    <span>{formatINR(cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sky-400">
                    <span>State GST (SGST):</span>
                    <span>{formatINR(sgstTotal)}</span>
                  </div>
                </>
              )}

              {cessTotal > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>GST Cess:</span>
                  <span>{formatINR(cessTotal)}</span>
                </div>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Round Off:</span>
                  <span>{formatINR(roundOff)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-emerald-400 border-t-2 border-slate-700 pt-2">
                <span>Grand Total:</span>
                <span>{formatINR(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Initial Payment Receipt */}
          {!initialInvoice && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recordPaymentCheck"
                  checked={recordPaymentNow}
                  onChange={e => setRecordPaymentNow(e.target.checked)}
                  className="rounded-sm border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="recordPaymentCheck"
                  className="font-bold text-emerald-950 cursor-pointer select-none"
                >
                  Receive customer payment immediately for this invoice?
                </label>
              </div>

              {recordPaymentNow && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-emerald-200/60">
                  <div>
                    <label className="block text-emerald-900 font-semibold mb-1">Amount Received (₹)</label>
                    <input
                      type="number"
                      max={totalAmount}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 font-mono text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-900 font-semibold mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white"
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-emerald-900 font-semibold mb-1">Deposit Into Account</label>
                    <select
                      value={paymentAccountId}
                      onChange={e => setPaymentAccountId(e.target.value)}
                      className="w-full border border-emerald-300 rounded-lg px-3 py-1.5 text-slate-900 bg-white"
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

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors"
            >
              {initialInvoice ? 'Save Invoice Changes' : 'Generate Tax Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
