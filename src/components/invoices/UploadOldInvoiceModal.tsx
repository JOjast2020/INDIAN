import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  IndianRupee,
  Paperclip,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Invoice, InvoiceItem, PaymentMethod } from '../../types';
import { calculateGST, formatINR, INDIAN_STATES } from '../../utils/indianGST';

interface UploadOldInvoiceModalProps {
  onClose: () => void;
  onSuccess?: (invoice: Invoice) => void;
}

export const UploadOldInvoiceModal: React.FC<UploadOldInvoiceModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { state, saveInvoice, saveCustomer, showToast } = useApp();
  const bSettings = state.settings;

  // File state
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  // Form Fields
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().substring(0, 10)
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );

  // Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    state.customers[0]?.id || ''
  );
  const [isCustomCustomer, setIsCustomCustomer] = useState<boolean>(false);
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [customCustomerGstin, setCustomCustomerGstin] = useState<string>('');
  const [customerState, setCustomerState] = useState<string>(bSettings.state);
  const [customerStateCode, setCustomerStateCode] = useState<string>(bSettings.stateCode);

  // Amounts & Taxes
  const [itemDescription, setItemDescription] = useState<string>(
    'Agricultural Products & Farm Supplies (Historical Invoice)'
  );
  const [hsnSac, setHsnSac] = useState<string>('3101');
  const [taxableAmount, setTaxableAmount] = useState<number>(25000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInterstate, setIsInterstate] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partially Paid'>('Paid');
  const [paidAmount, setPaidAmount] = useState<number>(29500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [notes, setNotes] = useState<string>(
    'Old invoice imported with attached PDF documentation.'
  );

  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Calculate taxes
  const calculatedTax = calculateGST(taxableAmount, gstRate, isInterstate);
  const totalAmount = calculatedTax.totalAmount;

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15 MB limit. Please upload a smaller file.');
      return;
    }

    setError('');
    setFileName(file.name);
    setFileType(file.type);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    // Auto-extract possible invoice number from filename if patterned
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const numMatch = cleanName.match(/(?:INV|BILL|TAX|REC|NO)[-_ ]?([A-Za-z0-9\/-]+)/i);
    if (numMatch && numMatch[0]) {
      setInvoiceNumber(numMatch[0].toUpperCase());
    } else if (!invoiceNumber) {
      setInvoiceNumber(`OLD-${cleanName.substring(0, 15).toUpperCase().replace(/[^A-Z0-9]/g, '-')}`);
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result as string;
      setFileDataUrl(dataUrl);
      showToast(`Uploaded ${file.name} successfully. Fill or verify invoice fields.`, 'info');
    };
    reader.onerror = () => {
      setError('Failed to read the file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleCustomerChange = (custId: string) => {
    if (custId === 'new') {
      setIsCustomCustomer(true);
      setSelectedCustomerId('');
      setCustomCustomerName('');
      setCustomCustomerGstin('');
    } else {
      setIsCustomCustomer(false);
      setSelectedCustomerId(custId);
      const cust = state.customers.find(c => c.id === custId);
      if (cust) {
        setCustomerState(cust.state);
        setCustomerStateCode(cust.stateCode);
        setIsInterstate(cust.stateCode !== bSettings.stateCode);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fileName || !fileDataUrl) {
      setError('Please choose a PDF or image file of your old invoice to upload.');
      return;
    }

    if (!invoiceNumber.trim()) {
      setError('Please provide an Invoice Number.');
      return;
    }

    if (taxableAmount <= 0) {
      setError('Taxable amount must be greater than zero.');
      return;
    }

    let customerId = selectedCustomerId;
    let custName = '';
    let custGstin = '';
    let custAddr = '';

    if (isCustomCustomer) {
      if (!customCustomerName.trim()) {
        setError('Please enter customer company or person name.');
        return;
      }
      custName = customCustomerName.trim();
      custGstin = customCustomerGstin.trim().toUpperCase();
      customerId = `CUST-IMP-${Date.now()}`;
      custAddr = `${customerState}, India`;

      // Save new customer into customer directory
      const newCust: Customer = {
        id: customerId,
        customerId: `CUST-${(state.customers.length + 1).toString().padStart(3, '0')}`,
        name: custName,
        companyName: custName,
        mobile: '',
        email: '',
        billingAddress: custAddr,
        city: customerState,
        state: customerState,
        stateCode: customerStateCode,
        pincode: '',
        gstin: custGstin,
        pan: custGstin.length >= 10 ? custGstin.substring(2, 12) : '',
        customerType: custGstin ? 'Regular' : 'Consumer',
        creditLimit: 0,
        openingBalance: 0,
        currentBalance: paymentStatus === 'Paid' ? 0 : totalAmount,
        createdAt: invoiceDate,
      };
      saveCustomer(newCust);
    } else {
      const existing = state.customers.find(c => c.id === selectedCustomerId);
      if (!existing) {
        setError('Please select a customer.');
        return;
      }
      custName = existing.companyName || existing.name;
      custGstin = existing.gstin || '';
      custAddr = existing.billingAddress;
    }

    setIsProcessing(true);

    const invoiceItem: InvoiceItem = {
      id: `ITEM-IMP-${Date.now()}`,
      productId: 'PRD-HISTORICAL',
      productName: itemDescription.trim() || 'Old Invoice Supply',
      hsnSac: hsnSac.trim() || '3101',
      quantity: 1,
      unit: 'SET',
      rate: taxableAmount,
      discount: 0,
      discountType: 'percentage',
      taxableAmount: taxableAmount,
      gstRate: gstRate,
      cgstAmount: calculatedTax.cgstAmount,
      sgstAmount: calculatedTax.sgstAmount,
      igstAmount: calculatedTax.igstAmount,
      cessRate: 0,
      cessAmount: 0,
      totalAmount: totalAmount,
    };

    const actualPaid =
      paymentStatus === 'Paid'
        ? totalAmount
        : paymentStatus === 'Partially Paid'
        ? Math.min(totalAmount, Math.max(0, paidAmount))
        : 0;
    const balanceDue = Math.max(0, totalAmount - actualPaid);

    const newInvoice: Invoice = {
      id: `INV-IMP-${Date.now()}`,
      invoiceNumber: invoiceNumber.trim().toUpperCase(),
      invoiceDate,
      dueDate,
      customerId,
      customerName: custName,
      customerGstin: custGstin,
      customerAddress: custAddr,
      customerState,
      customerStateCode,
      placeOfSupply: customerState,
      placeOfSupplyCode: customerStateCode,
      isInterstate,
      reverseCharge: false,
      items: [invoiceItem],
      subtotal: taxableAmount,
      discountTotal: 0,
      taxableAmount: taxableAmount,
      cgstTotal: calculatedTax.cgstAmount,
      sgstTotal: calculatedTax.sgstAmount,
      igstTotal: calculatedTax.igstAmount,
      cessTotal: 0,
      roundOff: 0,
      totalAmount,
      amountPaid: actualPaid,
      balanceDue,
      paymentStatus:
        balanceDue <= 0 ? 'Paid' : actualPaid > 0 ? 'Partially Paid' : 'Unpaid',
      attachmentName: fileName,
      attachmentData: fileDataUrl,
      isImported: true,
      notes: notes.trim(),
      termsAndConditions: bSettings.defaultPaymentTerms,
      createdAt: invoiceDate,
    };

    saveInvoice(newInvoice);
    showToast(
      `Old Invoice ${newInvoice.invoiceNumber} with attached PDF has been successfully added to Tax Invoices!`,
      'success'
    );

    if (onSuccess) {
      onSuccess(newInvoice);
    }
    onClose();
  };

  const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Upload Old Invoice (PDF / Scanned Copy)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Document Import
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload your past invoice PDF or scanned bill. It will be added into your Tax Invoices register with the attached document.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Upload Box */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 transition-all text-center">
            <input
              type="file"
              id="old-invoice-file-input"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {!fileName ? (
              <label
                htmlFor="old-invoice-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-800 hover:text-indigo-600 underline">
                    Click to browse or drop your Old Invoice PDF / Scan
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports PDF, PNG, JPG files (Up to 15 MB)
                  </p>
                </div>
              </label>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{fileName}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isPdf ? 'PDF Document' : 'Image Scan'} • {fileSize}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="old-invoice-file-input"
                    className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Replace File
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Grid Layout: Left Document Preview / Right Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Preview Pane */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-3 flex flex-col min-h-[300px] max-h-[460px]">
              <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800 text-[11px]">
                <span className="font-semibold flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Document Attachment Preview</span>
                </span>
                {fileName && <span className="font-mono text-slate-400">{fileSize}</span>}
              </div>

              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/70 mt-2 p-2">
                {fileDataUrl ? (
                  isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <object
                        data={fileDataUrl}
                        type="application/pdf"
                        className="w-full h-80 rounded-lg border border-slate-800 bg-white"
                      >
                        <div className="text-slate-400 text-xs p-4">
                          <FileText className="w-12 h-12 mx-auto text-indigo-400 mb-2" />
                          <p className="font-bold text-white mb-1">PDF File Ready</p>
                          <p className="text-[11px]">{fileName}</p>
                          <a
                            href={fileDataUrl}
                            download={fileName}
                            className="inline-block mt-3 px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-bold"
                          >
                            Open / Download PDF
                          </a>
                        </div>
                      </object>
                    </div>
                  ) : (
                    <img
                      src={fileDataUrl}
                      alt="Uploaded invoice scan"
                      className="max-h-80 w-auto object-contain rounded-lg shadow-md"
                    />
                  )
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <FileText className="w-12 h-12 mx-auto opacity-30 mb-2" />
                    <span>Upload a PDF to view preview here</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Fields Pane */}
            <div className="lg:col-span-7 space-y-4">
              <div className="font-bold text-slate-900 border-b pb-2 flex items-center justify-between">
                <span>Invoice Information for Tax Register</span>
                <span className="text-slate-500 font-normal text-[11px]">
                  Fill or confirm extracted particulars
                </span>
              </div>

              {/* Row 1: Invoice # and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Invoice Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2025-042"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Customer */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold">Client / Customer</label>
                  <button
                    type="button"
                    onClick={() => handleCustomerChange(isCustomCustomer ? (state.customers[0]?.id || '') : 'new')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    {isCustomCustomer ? '← Choose Existing Customer' : '+ Type Custom Customer Name'}
                  </button>
                </div>

                {!isCustomCustomer ? (
                  <select
                    value={selectedCustomerId}
                    onChange={e => handleCustomerChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {state.customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName || c.name} {c.gstin ? `(${c.gstin})` : '(Unregistered)'} - {c.state}
                      </option>
                    ))}
                    <option value="new">+ Add New / Custom Customer Name...</option>
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <input
                        type="text"
                        placeholder="Customer Company or Name *"
                        required
                        value={customCustomerName}
                        onChange={e => setCustomCustomerName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Customer GSTIN (Optional)"
                        value={customCustomerGstin}
                        onChange={e => setCustomCustomerGstin(e.target.value.toUpperCase())}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* State & Interstate selector */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-0.5">
                      Supply Destination State
                    </label>
                    <select
                      value={customerState}
                      onChange={e => {
                        const st = INDIAN_STATES.find(s => s.name === e.target.value);
                        if (st) {
                          setCustomerState(st.name);
                          setCustomerStateCode(st.code);
                          setIsInterstate(st.code !== bSettings.stateCode);
                        }
                      }}
                      className="w-full border border-slate-300 rounded-lg p-1.5 bg-white text-xs"
                    >
                      {INDIAN_STATES.map(s => (
                        <option key={s.code} value={s.name}>
                          {s.code} - {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-0.5">
                      GST Supply Nature
                    </label>
                    <div className="p-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-xs text-slate-800">
                      {isInterstate ? 'Interstate (Input/Output IGST)' : 'Intrastate (CGST + SGST)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Items Description & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Invoice Item / Service Description
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDescription}
                    onChange={e => setItemDescription(e.target.value)}
                    placeholder="e.g. Agricultural Machinery / Irrigation Piping"
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-slate-700 font-semibold mb-1">HSN / SAC</label>
                  <input
                    type="text"
                    value={hsnSac}
                    onChange={e => setHsnSac(e.target.value)}
                    placeholder="e.g. 3101"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Taxable Value & GST Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Taxable Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={taxableAmount}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setTaxableAmount(val);
                      if (paymentStatus === 'Paid') {
                        const tax = calculateGST(val, gstRate, isInterstate);
                        setPaidAmount(tax.totalAmount);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Rate</label>
                  <select
                    value={gstRate}
                    onChange={e => {
                      const rate = parseInt(e.target.value, 10);
                      setGstRate(rate);
                      if (paymentStatus === 'Paid') {
                        const tax = calculateGST(taxableAmount, rate, isInterstate);
                        setPaidAmount(tax.totalAmount);
                      }
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value={0}>0% (Exempt / Nil Rated)</option>
                    <option value={5}>5% (Essential Agri Goods)</option>
                    <option value={12}>12% (Standard Agro Items)</option>
                    <option value={18}>18% (General Standard Rate)</option>
                    <option value={28}>28% (Special Goods)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Bill Value</label>
                  <div className="w-full border border-emerald-300 bg-emerald-50 rounded-lg p-2 font-mono font-bold text-emerald-800 text-sm">
                    {formatINR(totalAmount)}
                  </div>
                </div>
              </div>

              {/* Tax Breakup Indicator */}
              <div className="bg-slate-50 p-2.5 rounded-lg border flex flex-wrap justify-between text-[11px] font-mono text-slate-600">
                <span>Taxable: {formatINR(taxableAmount)}</span>
                {isInterstate ? (
                  <span>IGST ({gstRate}%): {formatINR(calculatedTax.igstAmount)}</span>
                ) : (
                  <>
                    <span>CGST ({gstRate / 2}%): {formatINR(calculatedTax.cgstAmount)}</span>
                    <span>SGST ({gstRate / 2}%): {formatINR(calculatedTax.sgstAmount)}</span>
                  </>
                )}
                <span className="font-bold text-slate-900">Total: {formatINR(totalAmount)}</span>
              </div>

              {/* Row 5: Payment Status */}
              <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => {
                      const st = e.target.value as any;
                      setPaymentStatus(st);
                      if (st === 'Paid') setPaidAmount(totalAmount);
                      else if (st === 'Unpaid') setPaidAmount(0);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  >
                    <option value="Paid">Paid (Fully Cleared)</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Unpaid">Unpaid (Outstanding Due)</option>
                  </select>
                </div>

                {paymentStatus !== 'Unpaid' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Settled Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      <option value="Bank Transfer">Bank Wire / NEFT</option>
                      <option value="UPI">UPI (6380323254@sbi)</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {paymentStatus === 'Paid' ? 'Paid Amount' : 'Balance Due'}
                  </label>
                  <div className="w-full border border-slate-300 bg-white rounded-lg p-2 font-mono font-bold text-slate-900">
                    {paymentStatus === 'Paid' ? formatINR(totalAmount) : formatINR(totalAmount - paidAmount)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {fileName ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Attached file will be permanently accessible in the invoice view
                </span>
              ) : (
                'Select a file above to attach to this invoice'
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <FileUp className="w-4 h-4" />
                <span>Save & Add to Invoices</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
