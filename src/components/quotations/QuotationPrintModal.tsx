import React from 'react';
import { Download, FileText, Printer, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Quotation } from '../../types';
import { formatINR, numberToWordsINR } from '../../utils/indianGST';
import { BrandLogo } from '../common/BrandLogo';

interface QuotationPrintModalProps {
  quotation: Quotation | null;
  onClose: () => void;
  onConvertToInvoice?: (quotation: Quotation) => void;
}

export const QuotationPrintModal: React.FC<QuotationPrintModalProps> = ({
  quotation,
  onClose,
  onConvertToInvoice,
}) => {
  const { state } = useApp();

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const printEl = document.getElementById('printable-gst-quotation');
    if (!printEl) return;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${quotation.quotationNumber} - Mr. Farmer Corp. Quotation</title>
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
    a.download = `${quotation.quotationNumber.replace(/\//g, '_')}_MrFarmerCorp_Estimate.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const s = state.settings;
  const words = numberToWordsINR(quotation.totalAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
        {/* Modal Controls Bar */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm font-mono">{quotation.quotationNumber}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                quotation.status === 'Converted'
                  ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700'
                  : quotation.status === 'Accepted'
                  ? 'bg-sky-900/70 text-sky-300 border border-sky-700'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {quotation.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onConvertToInvoice && quotation.status !== 'Converted' && (
              <button
                type="button"
                onClick={() => onConvertToInvoice(quotation)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Convert to Invoice</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible bg-white text-slate-900 text-xs">
          <div id="printable-gst-quotation" className="max-w-3xl mx-auto space-y-6">
            {/* Header: Company & Quotation Title */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <BrandLogo
                    variant="icon"
                    size="md"
                    logoUrl={s.logoUrl}
                    businessName={s.businessName}
                    className="shrink-0 mt-1"
                  />
                  <div>
                    <h1
                      className="text-2xl font-black font-serif tracking-tight text-slate-950 uppercase"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                    >
                      {s.businessName}
                    </h1>
                    <div className="text-[11px] font-semibold text-amber-700 font-mono tracking-wide">
                      {s.tradeName || 'mr.farmercorp'}
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 max-w-sm">
                      {s.address}, {s.city}, {s.state} - {s.pincode}
                    </p>
                    <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-x-3">
                      <span>Phone: <strong>{s.phone}</strong></span>
                      <span>Email: <strong>{s.email}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-900 border border-amber-500/30 font-bold uppercase tracking-wider text-sm rounded">
                    ESTIMATE / QUOTATION
                  </div>
                  <div className="mt-2 text-slate-700 text-xs font-mono space-y-0.5">
                    <div>
                      <span className="text-slate-500">Quote #: </span>
                      <strong className="text-slate-900">{quotation.quotationNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Date: </span>
                      <strong>{quotation.quotationDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Valid Until: </span>
                      <strong>{quotation.validUntil}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Credentials Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2 rounded">
                <div>
                  <span className="text-slate-500">GSTIN: </span>
                  <strong className="font-mono text-slate-900">{s.gstin}</strong>
                </div>
                <div>
                  <span className="text-slate-500">PAN: </span>
                  <strong className="font-mono text-slate-900">{s.pan}</strong>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">State / Code: </span>
                  <strong>{s.state} ({s.stateCode})</strong>
                </div>
              </div>
            </div>

            {/* Bill To & Supply Details */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Quotation For (Customer)
                </span>
                <div className="font-bold text-slate-900 text-sm">{quotation.customerName}</div>
                {quotation.customerAddress && (
                  <div className="text-slate-600 text-[11px] mt-1 whitespace-pre-line">
                    {quotation.customerAddress}
                  </div>
                )}
                <div className="text-[11px] text-slate-700 mt-2 space-y-0.5">
                  <div>
                    <span className="text-slate-500">Customer GSTIN: </span>
                    <strong className="font-mono">{quotation.customerGstin || 'Unregistered'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">State: </span>
                    <strong>{quotation.customerState} ({quotation.customerStateCode})</strong>
                  </div>
                </div>
              </div>

              <div className="border-l border-slate-200 pl-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Supply & Estimation Terms
                </span>
                <div className="text-[11px] text-slate-700 space-y-1.5 mt-2">
                  <div>
                    <span className="text-slate-500">Place of Supply: </span>
                    <strong>{quotation.placeOfSupply} ({quotation.placeOfSupplyCode})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">GST Assessment: </span>
                    <strong className="font-medium">
                      {quotation.isInterstate ? 'Interstate (Integrated GST - IGST)' : 'Intrastate (Central + State GST)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Status: </span>
                    <strong className="font-medium text-indigo-700">{quotation.status}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-3 text-center w-10">#</th>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-2 text-center">HSN/SAC</th>
                    <th className="py-2 px-2 text-center">Qty / UOM</th>
                    <th className="py-2 px-2 text-right">Rate (₹)</th>
                    <th className="py-2 px-2 text-right">Taxable (₹)</th>
                    <th className="py-2 px-2 text-center">GST %</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border-b border-slate-300">
                  {quotation.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600 text-[11px]">
                        {item.hsnSac || '-'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-800 text-[11px]">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700 text-[11px]">
                        {item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700 text-[11px]">
                        {item.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600 text-[11px]">
                        {item.gstRate}%
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-[11px]">
                        {item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="grid grid-cols-2 gap-6 items-start">
              {/* Left Column: Amount in Words, Bank Details, Notes */}
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Estimated Amount in Words:
                  </span>
                  <div className="text-xs font-semibold text-slate-800 mt-1 capitalize leading-relaxed">
                    INR {words} Only
                  </div>
                </div>

                {s.bankName && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Bank Settlement Details:
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-slate-700 font-mono">
                      <div>Bank: <strong className="text-slate-900 font-sans">{s.bankName}</strong></div>
                      <div>A/C: <strong className="text-slate-900">{s.accountNumber}</strong></div>
                      <div>IFSC: <strong className="text-slate-900">{s.ifscCode}</strong></div>
                      <div>Branch: <strong className="text-slate-900 font-sans">{s.branch}</strong></div>
                    </div>
                  </div>
                )}

                {quotation.notes && (
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold text-slate-700 block">Quotation Remarks:</span>
                    <p className="mt-0.5 leading-relaxed">{quotation.notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Tax Breakdown Table & Grand Total */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatINR(quotation.taxableAmount)}
                  </span>
                </div>

                {!quotation.isInterstate ? (
                  <>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>Central Tax (CGST):</span>
                      <span className="font-mono text-slate-800">{formatINR(quotation.cgstTotal)}</span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>State Tax (SGST):</span>
                      <span className="font-mono text-slate-800">{formatINR(quotation.sgstTotal)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Integrated Tax (IGST):</span>
                    <span className="font-mono text-slate-800">{formatINR(quotation.igstTotal)}</span>
                  </div>
                )}

                {quotation.cessTotal > 0 && (
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Cess:</span>
                    <span className="font-mono text-slate-800">{formatINR(quotation.cessTotal)}</span>
                  </div>
                )}

                {quotation.roundOff !== 0 && (
                  <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                    <span>Round Off:</span>
                    <span className="font-mono">
                      {quotation.roundOff > 0 ? `+${quotation.roundOff.toFixed(2)}` : quotation.roundOff.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-base font-bold text-slate-900">
                  <span>Estimated Total:</span>
                  <span className="font-mono">{formatINR(quotation.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Signatures */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] items-end">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Terms & Conditions:</span>
                <p className="text-slate-600 text-[10px] leading-relaxed whitespace-pre-line">
                  {quotation.termsAndConditions ||
                    '1. Quotation valid for 30 days from date of issue.\n2. Goods once delivered cannot be returned.\n3. Subject to jurisdiction at our registered business location.'}
                </p>
              </div>

              <div className="text-right space-y-10">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    For {s.businessName}
                  </span>
                  <span className="font-serif font-bold text-xs text-amber-900">
                    {s.tradeName || 'mr.farmercorp'}
                  </span>
                </div>
                <div className="border-t border-slate-400 inline-block pt-1 px-8">
                  <span className="text-[10px] text-slate-600 font-medium">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
