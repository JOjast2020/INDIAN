import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Download,
  FileCheck2,
  FileSpreadsheet,
  Filter,
  Layers,
  Printer,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/indianGST';

export const GSTReports: React.FC = () => {
  const { state, showToast } = useApp();
  const [reportType, setReportType] = useState<'summary' | 'gstr1' | 'gstr3b'>('summary');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Filter valid invoices and purchases
  const validInvoices = useMemo(
    () => state.invoices.filter(i => i.paymentStatus !== 'Cancelled'),
    [state.invoices]
  );
  const validPurchases = useMemo(
    () => state.purchases.filter(p => p.paymentStatus !== 'Cancelled'),
    [state.purchases]
  );
  const eligibleExpenses = useMemo(
    () => state.expenses.filter(e => e.gstApplicable && e.gstAmount > 0),
    [state.expenses]
  );

  // Month filtered
  const filteredInvoices = useMemo(() => {
    if (selectedMonth === 'all') return validInvoices;
    return validInvoices.filter(i => i.invoiceDate.slice(5, 7) === selectedMonth);
  }, [validInvoices, selectedMonth]);

  const filteredPurchases = useMemo(() => {
    if (selectedMonth === 'all') return validPurchases;
    return validPurchases.filter(p => p.purchaseDate.slice(5, 7) === selectedMonth);
  }, [validPurchases, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === 'all') return eligibleExpenses;
    return eligibleExpenses.filter(e => e.date.slice(5, 7) === selectedMonth);
  }, [eligibleExpenses, selectedMonth]);

  // Outward Supplies (Sales)
  const taxableSales = filteredInvoices.reduce((sum, i) => sum + i.taxableAmount, 0);
  const cgstCollected = filteredInvoices.reduce((sum, i) => sum + i.cgstTotal, 0);
  const sgstCollected = filteredInvoices.reduce((sum, i) => sum + i.sgstTotal, 0);
  const igstCollected = filteredInvoices.reduce((sum, i) => sum + i.igstTotal, 0);
  const cessCollected = filteredInvoices.reduce((sum, i) => sum + i.cessTotal, 0);
  const totalOutputGst = cgstCollected + sgstCollected + igstCollected + cessCollected;

  // Inward Supplies (Purchases + Eligible Expenses ITC)
  const taxablePurchases = filteredPurchases.reduce((sum, p) => sum + p.taxableAmount, 0);
  const inputCgstPurchases = filteredPurchases.reduce((sum, p) => sum + p.cgstTotal, 0);
  const inputSgstPurchases = filteredPurchases.reduce((sum, p) => sum + p.sgstTotal, 0);
  const inputIgstPurchases = filteredPurchases.reduce((sum, p) => sum + p.igstTotal, 0);
  const inputCessPurchases = filteredPurchases.reduce((sum, p) => sum + p.cessTotal, 0);

  // Split eligible expenses into CGST/SGST if intrastate
  const inputGstExpenses = filteredExpenses.reduce((sum, e) => sum + e.gstAmount, 0);
  const inputCgstExpenses = Math.round((inputGstExpenses / 2) * 100) / 100;
  const inputSgstExpenses = inputGstExpenses - inputCgstExpenses;

  const totalInputCgst = inputCgstPurchases + inputCgstExpenses;
  const totalInputSgst = inputSgstPurchases + inputSgstExpenses;
  const totalInputIgst = inputIgstPurchases;
  const totalInputCess = inputCessPurchases;
  const totalInputGst = totalInputCgst + totalInputSgst + totalInputIgst + totalInputCess;

  // Net GST Payable / Credit Carry Forward
  const netGstPayable = totalOutputGst - totalInputGst;

  // GSTR-1 Categorization
  const b2bInvoices = filteredInvoices.filter(i => i.customerGstin && i.customerGstin.trim().length > 0);
  const b2cInvoices = filteredInvoices.filter(i => !i.customerGstin || i.customerGstin.trim().length === 0);

  // HSN Summary for GSTR-1 Table 12
  const hsnTableData = useMemo(() => {
    const map: Record<string, { hsn: string; desc: string; uqc: string; qty: number; taxable: number; cgst: number; sgst: number; igst: number; totalTax: number }> = {};
    filteredInvoices.forEach(inv => {
      inv.items.forEach(it => {
        const key = it.hsnSac || 'OTHER';
        if (!map[key]) {
          map[key] = {
            hsn: key,
            desc: it.productName,
            uqc: it.unit,
            qty: 0,
            taxable: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
          };
        }
        map[key].qty += it.quantity;
        map[key].taxable += it.taxableAmount;
        map[key].cgst += it.cgstAmount;
        map[key].sgst += it.sgstAmount;
        map[key].igst += it.igstAmount;
        map[key].totalTax += it.cgstAmount + it.sgstAmount + it.igstAmount;
      });
    });
    return Object.values(map);
  }, [filteredInvoices]);

  const handleExportGstr1 = () => {
    const headers = [
      'GSTIN/UIN of Recipient',
      'Receiver Name',
      'Invoice Number',
      'Invoice Date',
      'Invoice Value',
      'Place of Supply',
      'Reverse Charge',
      'Invoice Type',
      'Rate',
      'Taxable Value',
      'Cess Amount',
    ];

    const rows = filteredInvoices.map(i => [
      `"${i.customerGstin || ''}"`,
      `"${i.customerName}"`,
      `"${i.invoiceNumber}"`,
      `"${i.invoiceDate}"`,
      i.totalAmount,
      `"${i.placeOfSupplyCode}-${i.placeOfSupply}"`,
      i.reverseCharge ? 'Y' : 'N',
      i.customerGstin ? 'Regular B2B' : 'B2C',
      `${i.items[0]?.gstRate || 18}%`,
      i.taxableAmount,
      i.cessTotal,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GSTR1_Export_${state.settings.financialYear}_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('GSTR-1 report exported in standard GST portal format.');
  };

  return (
    <div className="space-y-6">
      {/* Scope and Tab Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 max-w-full overflow-hidden">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setReportType('summary')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                reportType === 'summary' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              GST Summary & Computation
            </button>
            <button
              onClick={() => setReportType('gstr1')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                reportType === 'gstr1' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              GSTR-1 (Outward Supplies)
            </button>
            <button
              onClick={() => setReportType('gstr3b')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                reportType === 'gstr3b' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              GSTR-3B (Tax Return Preview)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 outline-hidden"
          >
            <option value="all">Full Financial Year ({state.settings.financialYear})</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
          </select>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportGstr1}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Compliance Advisory Note */}
      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Statutory Note:</strong> Exported data adheres to Indian GST structure for GSTR-1
          and GSTR-3B filing. Actual portal submission requires logging into gst.gov.in using
          authorized digital signature (DSC) or OTP.
        </span>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Output Tax */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Output GST (Collected)</span>
            <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">
              Sales Tax
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700">
            {formatINR(totalOutputGst)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 text-[11px] font-mono text-slate-500">
            <div>
              <span>CGST: </span>
              <span className="font-semibold text-slate-800">{formatINR(cgstCollected)}</span>
            </div>
            <div>
              <span>SGST: </span>
              <span className="font-semibold text-slate-800">{formatINR(sgstCollected)}</span>
            </div>
            <div>
              <span>IGST: </span>
              <span className="font-semibold text-slate-800">{formatINR(igstCollected)}</span>
            </div>
          </div>
        </div>

        {/* Input Tax Credit (ITC) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Input GST (Eligible ITC)</span>
            <span className="font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded-sm">
              Purchases & Costs
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-sky-700">{formatINR(totalInputGst)}</div>
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 text-[11px] font-mono text-slate-500">
            <div>
              <span>CGST: </span>
              <span className="font-semibold text-slate-800">{formatINR(totalInputCgst)}</span>
            </div>
            <div>
              <span>SGST: </span>
              <span className="font-semibold text-slate-800">{formatINR(totalInputSgst)}</span>
            </div>
            <div>
              <span>IGST: </span>
              <span className="font-semibold text-slate-800">{formatINR(totalInputIgst)}</span>
            </div>
          </div>
        </div>

        {/* Net GST Payable */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Net Tax Liability / ITC Carry</span>
            <span
              className={`font-mono px-2 py-0.5 rounded-sm ${
                netGstPayable > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {netGstPayable > 0 ? 'Cash Payable' : 'ITC Surplus'}
            </span>
          </div>
          <div
            className={`mt-2 text-2xl font-bold font-mono ${
              netGstPayable > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {formatINR(Math.abs(netGstPayable))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            {netGstPayable > 0
              ? 'To be deposited via electronic cash ledger'
              : 'Credit carried forward to next tax period'}
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      {reportType === 'summary' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
            GST Reconciliation & Audit Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outward Taxable Supplies */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
              <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-emerald-800">
                1. Outward Supplies (Tax Invoices)
              </span>
              <div className="space-y-1 font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Total Taxable Turnover:</span>
                  <span className="font-bold text-slate-900">{formatINR(taxableSales)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Central Tax (CGST):</span>
                  <span>{formatINR(cgstCollected)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">State Tax (SGST):</span>
                  <span>{formatINR(sgstCollected)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Integrated Tax (IGST):</span>
                  <span>{formatINR(igstCollected)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-emerald-700 pt-2 border-t">
                  <span>Total Output Tax:</span>
                  <span>{formatINR(totalOutputGst)}</span>
                </div>
              </div>
            </div>

            {/* Inward Supplies ITC */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-2 bg-slate-50/50">
              <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-sky-800">
                2. Inward Supplies (Eligible Input Tax Credit)
              </span>
              <div className="space-y-1 font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Taxable Inward Purchases:</span>
                  <span className="font-bold text-slate-900">{formatINR(taxablePurchases)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Input CGST Available:</span>
                  <span>{formatINR(totalInputCgst)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Input SGST Available:</span>
                  <span>{formatINR(totalInputSgst)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Input IGST Available:</span>
                  <span>{formatINR(totalInputIgst)}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-sky-700 pt-2 border-t">
                  <span>Total ITC Available:</span>
                  <span>{formatINR(totalInputGst)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'gstr1' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              GSTR-1 Outward Supplies (B2B vs B2C Split)
            </h3>
            <p className="text-slate-500 mt-0.5">
              Section 4A (B2B registered invoices) and Section 7 (B2C consumer supplies)
            </p>
          </div>

          {/* B2B Table */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
              Table 4: B2B Invoices ({b2bInvoices.length} invoices)
            </span>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-semibold font-mono">
                  <tr>
                    <th className="p-2">Invoice #</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">GSTIN</th>
                    <th className="p-2">Recipient Name</th>
                    <th className="p-2">POS</th>
                    <th className="p-2 text-right">Taxable Value</th>
                    <th className="p-2 text-right">IGST</th>
                    <th className="p-2 text-right">CGST</th>
                    <th className="p-2 text-right">SGST</th>
                    <th className="p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {b2bInvoices.map(i => (
                    <tr key={i.id}>
                      <td className="p-2 font-bold text-slate-900">{i.invoiceNumber}</td>
                      <td className="p-2 text-slate-600">{i.invoiceDate}</td>
                      <td className="p-2 font-bold text-indigo-700">{i.customerGstin}</td>
                      <td className="p-2 font-sans font-medium text-slate-800">{i.customerName}</td>
                      <td className="p-2">{i.placeOfSupplyCode}</td>
                      <td className="p-2 text-right">{formatINR(i.taxableAmount)}</td>
                      <td className="p-2 text-right">{formatINR(i.igstTotal)}</td>
                      <td className="p-2 text-right">{formatINR(i.cgstTotal)}</td>
                      <td className="p-2 text-right">{formatINR(i.sgstTotal)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{formatINR(i.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 12: HSN Summary */}
          <div className="space-y-2 pt-4 border-t">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
              Table 12: HSN-Wise Summary of Outward Supplies
            </span>
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2">HSN/SAC</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-center">UQC</th>
                    <th className="p-2 text-center">Total Qty</th>
                    <th className="p-2 text-right">Total Taxable Value</th>
                    <th className="p-2 text-right">IGST</th>
                    <th className="p-2 text-right">CGST</th>
                    <th className="p-2 text-right">SGST</th>
                    <th className="p-2 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hsnTableData.map(h => (
                    <tr key={h.hsn}>
                      <td className="p-2 font-bold text-slate-900">{h.hsn}</td>
                      <td className="p-2 font-sans text-slate-800">{h.desc}</td>
                      <td className="p-2 text-center">{h.uqc}</td>
                      <td className="p-2 text-center font-bold">{h.qty}</td>
                      <td className="p-2 text-right">{formatINR(h.taxable)}</td>
                      <td className="p-2 text-right">{formatINR(h.igst)}</td>
                      <td className="p-2 text-right">{formatINR(h.cgst)}</td>
                      <td className="p-2 text-right">{formatINR(h.sgst)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">{formatINR(h.totalTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'gstr3b' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              GSTR-3B Monthly Return Computation Sheet
            </h3>
            <p className="text-slate-500 mt-0.5">
              Summary return of outward supplies and input tax credit claimed
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3">Section Description</th>
                  <th className="p-3 text-right">Total Taxable Value</th>
                  <th className="p-3 text-right">Integrated Tax (IGST)</th>
                  <th className="p-3 text-right">Central Tax (CGST)</th>
                  <th className="p-3 text-right">State/UT Tax (SGST)</th>
                  <th className="p-3 text-right">Cess</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50">
                  <td className="p-3 font-sans font-semibold text-slate-900">
                    3.1(a) Outward taxable supplies (other than zero rated, nil and exempt)
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatINR(taxableSales)}</td>
                  <td className="p-3 text-right">{formatINR(igstCollected)}</td>
                  <td className="p-3 text-right">{formatINR(cgstCollected)}</td>
                  <td className="p-3 text-right">{formatINR(sgstCollected)}</td>
                  <td className="p-3 text-right">{formatINR(cessCollected)}</td>
                </tr>

                <tr className="bg-white">
                  <td className="p-3 font-sans font-semibold text-slate-900">
                    4(A) Eligible ITC - All other ITC (Inward supplies from registered persons)
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">{formatINR(taxablePurchases)}</td>
                  <td className="p-3 text-right text-sky-700">{formatINR(totalInputIgst)}</td>
                  <td className="p-3 text-right text-sky-700">{formatINR(totalInputCgst)}</td>
                  <td className="p-3 text-right text-sky-700">{formatINR(totalInputSgst)}</td>
                  <td className="p-3 text-right text-sky-700">{formatINR(totalInputCess)}</td>
                </tr>

                <tr className="bg-amber-50/70 font-bold">
                  <td className="p-3 font-sans text-amber-900">
                    5.1 Net Tax Payable in Cash / Electronic Cash Ledger
                  </td>
                  <td className="p-3 text-right">-</td>
                  <td className="p-3 text-right text-amber-900">
                    {formatINR(Math.max(0, igstCollected - totalInputIgst))}
                  </td>
                  <td className="p-3 text-right text-amber-900">
                    {formatINR(Math.max(0, cgstCollected - totalInputCgst))}
                  </td>
                  <td className="p-3 text-right text-amber-900">
                    {formatINR(Math.max(0, sgstCollected - totalInputSgst))}
                  </td>
                  <td className="p-3 text-right text-amber-900">{formatINR(cessCollected)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
