import React, { useState } from 'react';
import { Download, FileText, Paperclip, Printer, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { formatINR, numberToWordsINR } from '../../utils/indianGST';
import { BrandLogo } from '../common/BrandLogo';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const { state } = useApp();
  const [activeView, setActiveView] = useState<'invoice' | 'attachment'>('invoice');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const printEl = document.getElementById('printable-gst-invoice');
    if (!printEl) return;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNumber} - Mr. Farmer Corp.</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #1e293b; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 12px; }
            .font-mono { font-family: monospace; }
          </style>
        </head>
        <body>
          ${printEl.innerHTML}
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber.replace(/\//g, '_')}_MrFarmerCorp.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const s = state.settings;
  const words = numberToWordsINR(invoice.totalAmount);

  // Group items by GST rate for HSN/GST summary
  const hsnSummary: Record<string, { hsn: string; taxable: number; rate: number; cgst: number; sgst: number; igst: number; total: number }> = {};
  invoice.items.forEach(it => {
    const key = `${it.hsnSac || 'OTHER'}-${it.gstRate}`;
    if (!hsnSummary[key]) {
      hsnSummary[key] = {
        hsn: it.hsnSac || 'N/A',
        taxable: 0,
        rate: it.gstRate,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
      };
    }
    hsnSummary[key].taxable += it.taxableAmount;
    hsnSummary[key].cgst += it.cgstAmount;
    hsnSummary[key].sgst += it.sgstAmount;
    hsnSummary[key].igst += it.igstAmount;
    hsnSummary[key].total += it.totalAmount;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Action Bar (hidden in print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm">Tax Invoice Preview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono">
              {invoice.invoiceNumber}
            </span>

            {/* Switcher if attachment exists */}
            {invoice.attachmentData && (
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveView('invoice')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    activeView === 'invoice'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  GST Invoice Format
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('attachment')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                    activeView === 'attachment'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Paperclip className="w-3 h-3" />
                  <span>Original Uploaded PDF</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HTML File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex-1">
          {activeView === 'attachment' && invoice.attachmentData ? (
            <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-300 max-w-4xl mx-auto flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 border-b mb-4">
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Original Uploaded Invoice Document: {invoice.attachmentName}</span>
                </span>
                <a
                  href={invoice.attachmentData}
                  download={invoice.attachmentName || 'Invoice_Document.pdf'}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
              {invoice.attachmentName?.toLowerCase().endsWith('.pdf') ? (
                <object
                  data={invoice.attachmentData}
                  type="application/pdf"
                  className="w-full h-[70vh] rounded-lg border border-slate-200"
                >
                  <div className="p-8 text-center text-slate-600">
                    <p className="font-bold">PDF Document: {invoice.attachmentName}</p>
                    <a
                      href={invoice.attachmentData}
                      download={invoice.attachmentName}
                      className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs"
                    >
                      Download PDF
                    </a>
                  </div>
                </object>
              ) : (
                <img
                  src={invoice.attachmentData}
                  alt={invoice.attachmentName || 'Uploaded Invoice'}
                  className="max-h-[70vh] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          ) : (
            <div
              id="printable-gst-invoice"
              className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-300 max-w-3xl mx-auto text-slate-800 text-xs leading-normal"
            >
            {/* Invoice Top Header */}
            <div className="text-center pb-2 border-b-2 border-slate-900">
              <h1 className="text-lg font-black tracking-widest text-slate-900 uppercase">TAX INVOICE</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                (Issued under Section 31 of CGST Act, 2017)
              </p>
              <span className="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xs">
                ORIGINAL FOR RECIPIENT
              </span>
            </div>

            {/* Business Header & Company Details with Logo */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-3.5 border-b border-slate-200">
              <div className="sm:col-span-7 flex items-start gap-3.5">
                {/* Mr. Farmer Corp Logo Emblem */}
                <BrandLogo
                  variant="icon"
                  size="xl"
                  logoUrl={s.logoUrl}
                  businessName={s.businessName}
                  className="shrink-0 mt-0.5"
                />

                <div className="min-w-0">
                  <h2
                    className="text-base sm:text-lg font-serif font-black tracking-tight leading-tight"
                    style={{ color: '#3d2514', fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {s.businessName}
                  </h2>
                  {s.tradeName && (
                    <p className="text-[11px] font-medium text-amber-800/90 font-mono">
                      Trade / Brand: {s.tradeName}
                    </p>
                  )}
                  <p className="text-slate-600 mt-1">{s.address}</p>
                  <p className="text-slate-600">
                    {s.city}, {s.state} - {s.pincode}
                  </p>

                  <div className="mt-2 space-y-0.5 font-mono text-[11px] bg-slate-50/80 p-2.5 rounded-md border border-slate-200">
                    <div>
                      <span className="font-semibold text-slate-700">GSTIN: </span>
                      <span className="font-bold text-slate-900">{s.gstin}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">PAN Number: </span>
                      <span className="font-bold text-slate-900">{s.pan}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Mobile: </span>
                      <span className="font-semibold text-slate-900">{s.phone}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Email: </span>
                      <span className="text-slate-800 font-medium">{s.email}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">State: </span>
                      <span>
                        {s.state} (Code: {s.stateCode})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Meta details right side */}
              <div className="sm:col-span-5 sm:border-l sm:border-slate-200 sm:pl-4 space-y-1 text-xs">
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-700">Invoice No:</span>
                  <span className="font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-700">Invoice Date:</span>
                  <span className="font-mono">{invoice.invoiceDate}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-700">Due Date:</span>
                  <span className="font-mono">{invoice.dueDate}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-700">Place of Supply:</span>
                  <span className="font-bold text-slate-800">
                    {invoice.placeOfSupply} ({invoice.placeOfSupplyCode})
                  </span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-700">Supply Type:</span>
                  <span>{invoice.isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)'}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="font-semibold text-slate-700">Reverse Charge:</span>
                  <span>{invoice.reverseCharge ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Customer Bill To & Ship To Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-slate-200 bg-slate-50/60 p-2.5 rounded-md my-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Billed To (Customer Details):
                </span>
                <div className="font-bold text-slate-900 text-xs">{invoice.customerName}</div>
                <p className="text-slate-600 mt-0.5">{invoice.customerAddress || 'Address on file'}</p>
                <div className="mt-1 font-mono text-[11px] space-y-0.5">
                  <div>
                    <span className="font-semibold">GSTIN: </span>
                    <span className="font-bold text-slate-900">
                      {invoice.customerGstin || 'Unregistered / Consumer'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">State: </span>
                    <span>
                      {invoice.customerState} (Code: {invoice.customerStateCode})
                    </span>
                  </div>
                </div>
              </div>

              <div className="sm:border-l sm:border-slate-200 sm:pl-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Shipped To / Consignee:
                </span>
                <div className="font-semibold text-slate-800 text-xs">{invoice.customerName}</div>
                <p className="text-slate-600 mt-0.5">{invoice.customerAddress || 'Same as billing address'}</p>
                <div className="mt-1 font-mono text-[11px]">
                  <span className="font-semibold">Destination: </span>
                  <span>{invoice.placeOfSupply}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300">
                    <th className="border border-slate-300 p-1.5 text-center w-8">#</th>
                    <th className="border border-slate-300 p-1.5 text-left">Description of Goods / Services</th>
                    <th className="border border-slate-300 p-1.5 text-center w-20">HSN/SAC</th>
                    <th className="border border-slate-300 p-1.5 text-center w-12">Qty</th>
                    <th className="border border-slate-300 p-1.5 text-center w-12">Unit</th>
                    <th className="border border-slate-300 p-1.5 text-right w-16">Rate (₹)</th>
                    <th className="border border-slate-300 p-1.5 text-right w-20">Taxable Val</th>
                    {invoice.isInterstate ? (
                      <th className="border border-slate-300 p-1.5 text-right w-20">IGST</th>
                    ) : (
                      <>
                        <th className="border border-slate-300 p-1.5 text-right w-16">CGST</th>
                        <th className="border border-slate-300 p-1.5 text-right w-16">SGST</th>
                      </>
                    )}
                    <th className="border border-slate-300 p-1.5 text-right w-20">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-medium text-slate-900">
                        {item.productName}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{item.hsnSac || '-'}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{item.quantity}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{item.unit}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        {formatINR(item.rate, false)}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-medium">
                        {formatINR(item.taxableAmount, false)}
                      </td>

                      {invoice.isInterstate ? (
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          <div>{formatINR(item.igstAmount, false)}</div>
                          <div className="text-[9px] text-slate-400">({item.gstRate}%)</div>
                        </td>
                      ) : (
                        <>
                          <td className="border border-slate-300 p-1.5 text-right font-mono">
                            <div>{formatINR(item.cgstAmount, false)}</div>
                            <div className="text-[9px] text-slate-400">({item.gstRate / 2}%)</div>
                          </td>
                          <td className="border border-slate-300 p-1.5 text-right font-mono">
                            <div>{formatINR(item.sgstAmount, false)}</div>
                            <div className="text-[9px] text-slate-400">({item.gstRate / 2}%)</div>
                          </td>
                        </>
                      )}

                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.totalAmount, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Grand Total Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-3">
              {/* Left Column: Bank Details & UPI QR code & In Words */}
              <div className="sm:col-span-7 flex flex-col justify-between border border-slate-200 p-2.5 rounded-md">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Invoice Amount in Words:
                  </div>
                  <div className="font-bold text-slate-900 text-xs italic">{words}</div>

                  {/* Bank & Payment Information */}
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Bank Remittance Details:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500">Bank: </span>
                        <span className="font-semibold text-slate-800">{s.bankName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">A/C No: </span>
                        <span className="font-semibold text-slate-900">{s.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">IFSC: </span>
                        <span className="font-semibold text-slate-900">{s.ifscCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">UPI ID: </span>
                        <span className="font-semibold text-emerald-700">{s.upiId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and notes */}
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700">Terms & Conditions: </span>
                  {invoice.termsAndConditions || s.defaultPaymentTerms}
                </div>
              </div>

              {/* Right Column: Calculations summary */}
              <div className="sm:col-span-5 bg-slate-50/80 border border-slate-200 p-2.5 rounded-md space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(invoice.subtotal)}</span>
                </div>
                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatINR(invoice.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-slate-800 border-t border-slate-200 pt-1">
                  <span>Taxable Value:</span>
                  <span>{formatINR(invoice.taxableAmount)}</span>
                </div>

                {invoice.isInterstate ? (
                  <div className="flex justify-between text-slate-700">
                    <span>Integrated GST (IGST):</span>
                    <span>{formatINR(invoice.igstTotal)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>Central GST (CGST):</span>
                      <span>{formatINR(invoice.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>State GST (SGST):</span>
                      <span>{formatINR(invoice.sgstTotal)}</span>
                    </div>
                  </>
                )}

                {invoice.cessTotal > 0 && (
                  <div className="flex justify-between text-slate-700">
                    <span>Cess:</span>
                    <span>{formatINR(invoice.cessTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-slate-950 border-t-2 border-slate-900 pt-1.5">
                  <span>Total Amount (INR):</span>
                  <span>{formatINR(invoice.totalAmount)}</span>
                </div>

                <div className="flex justify-between text-[11px] text-emerald-700 pt-1">
                  <span>Amount Paid:</span>
                  <span>{formatINR(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-rose-700">
                  <span>Balance Due:</span>
                  <span>{formatINR(invoice.balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* HSN Tax Summary Table */}
            <div className="mt-3 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                HSN / SAC Tax Rate Summary:
              </span>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 text-[10px] text-center font-mono">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="border border-slate-200 p-1">HSN/SAC</th>
                      <th className="border border-slate-200 p-1">Taxable Value</th>
                      <th className="border border-slate-200 p-1">GST Rate</th>
                      <th className="border border-slate-200 p-1">CGST</th>
                      <th className="border border-slate-200 p-1">SGST</th>
                      <th className="border border-slate-200 p-1">IGST</th>
                      <th className="border border-slate-200 p-1">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(hsnSummary).map((h, i) => (
                      <tr key={i}>
                        <td className="border border-slate-200 p-1">{h.hsn}</td>
                        <td className="border border-slate-200 p-1">{formatINR(h.taxable, false)}</td>
                        <td className="border border-slate-200 p-1">{h.rate}%</td>
                        <td className="border border-slate-200 p-1">{formatINR(h.cgst, false)}</td>
                        <td className="border border-slate-200 p-1">{formatINR(h.sgst, false)}</td>
                        <td className="border border-slate-200 p-1">{formatINR(h.igst, false)}</td>
                        <td className="border border-slate-200 p-1 font-bold">
                          {formatINR(h.cgst + h.sgst + h.igst, false)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with Signatory */}
            <div className="mt-6 pt-4 border-t border-slate-300 grid grid-cols-2 items-end">
              <div className="text-[10px] text-slate-500">
                <p>This is a computer generated invoice and conforms to GST Rule 46.</p>
                <p className="mt-0.5">Payment queries: {s.email}</p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-800">For {s.businessName}</span>
                <div className="h-14 flex items-center justify-end">
                  <div className="w-28 border-b border-dashed border-slate-400 pb-1 text-center text-[10px] text-slate-400">
                    [Seal / Digital Signature]
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 block uppercase">Authorized Signatory</span>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
