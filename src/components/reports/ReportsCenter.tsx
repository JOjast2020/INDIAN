import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  IndianRupee,
  Layers,
  Printer,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/indianGST';

type ReportCategory =
  | 'sales'
  | 'purchases'
  | 'daybook'
  | 'debtors'
  | 'creditors'
  | 'inventory'
  | 'hsn';

export const ReportsCenter: React.FC = () => {
  const { state, showToast } = useApp();
  const [selectedReport, setSelectedReport] = useState<ReportCategory>('sales');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().substring(0, 10));

  // 1. Sales Report
  const salesData = useMemo(() => {
    return state.invoices.filter(i => i.paymentStatus !== 'Cancelled');
  }, [state.invoices]);

  // 2. Purchase Report
  const purchaseData = useMemo(() => {
    return state.purchases.filter(p => p.paymentStatus !== 'Cancelled');
  }, [state.purchases]);

  // 3. Daybook: Combined chronological events of selected date
  const daybookData = useMemo(() => {
    const list: { time: string; type: string; ref: string; party: string; in: number; out: number }[] = [];

    state.invoices
      .filter(i => i.invoiceDate === dateFilter && i.paymentStatus !== 'Cancelled')
      .forEach(i => {
        list.push({
          time: 'Invoice',
          type: 'Sales Invoice',
          ref: i.invoiceNumber,
          party: i.customerName,
          in: i.totalAmount,
          out: 0,
        });
      });

    state.purchases
      .filter(p => p.purchaseDate === dateFilter && p.paymentStatus !== 'Cancelled')
      .forEach(p => {
        list.push({
          time: 'Purchase',
          type: 'Purchase Bill',
          ref: p.billNumber,
          party: p.supplierName,
          in: 0,
          out: p.totalAmount,
        });
      });

    state.payments
      .filter(p => p.date === dateFilter)
      .forEach(p => {
        list.push({
          time: 'Payment',
          type: p.type,
          ref: p.paymentNumber,
          party: p.entityName,
          in: p.type === 'Customer Payment' ? p.amount : 0,
          out: p.type === 'Supplier Payment' ? p.amount : 0,
        });
      });

    state.expenses
      .filter(e => e.date === dateFilter)
      .forEach(e => {
        list.push({
          time: 'Expense',
          type: e.category,
          ref: e.expenseNumber,
          party: e.vendor || e.description,
          in: 0,
          out: e.totalAmount,
        });
      });

    return list;
  }, [state.invoices, state.purchases, state.payments, state.expenses, dateFilter]);

  // 4. Customer Debtors (Outstanding)
  const debtorsData = useMemo(() => {
    return state.customers.filter(c => c.currentBalance > 0);
  }, [state.customers]);

  // 5. Supplier Creditors (Outstanding)
  const creditorsData = useMemo(() => {
    return state.suppliers.filter(s => s.currentBalance > 0);
  }, [state.suppliers]);

  // 6. Inventory Valuation
  const inventoryData = useMemo(() => {
    return state.products.filter(p => p.type === 'Product');
  }, [state.products]);

  // 7. HSN Sales
  const hsnData = useMemo(() => {
    const map: Record<string, { hsn: string; name: string; qty: number; value: number }> = {};
    salesData.forEach(inv => {
      inv.items.forEach(it => {
        const key = it.hsnSac || 'OTHER';
        if (!map[key]) {
          map[key] = { hsn: key, name: it.productName, qty: 0, value: 0 };
        }
        map[key].qty += it.quantity;
        map[key].value += it.taxableAmount;
      });
    });
    return Object.values(map);
  }, [salesData]);

  const handleExportCSV = () => {
    let rows: any[][] = [];
    let headers: string[] = [];
    let filename = `Report_${selectedReport}_${Date.now()}.csv`;

    if (selectedReport === 'sales') {
      headers = ['Invoice #', 'Date', 'Customer', 'GSTIN', 'Taxable', 'GST', 'Total', 'Paid', 'Balance', 'Status'];
      rows = salesData.map(i => [
        `"${i.invoiceNumber}"`,
        `"${i.invoiceDate}"`,
        `"${i.customerName}"`,
        `"${i.customerGstin}"`,
        i.taxableAmount,
        i.cgstTotal + i.sgstTotal + i.igstTotal,
        i.totalAmount,
        i.amountPaid,
        i.balanceDue,
        `"${i.paymentStatus}"`,
      ]);
    } else if (selectedReport === 'purchases') {
      headers = ['Bill #', 'Date', 'Supplier', 'GSTIN', 'Taxable', 'Input Tax', 'Total', 'Balance', 'Status'];
      rows = purchaseData.map(p => [
        `"${p.billNumber}"`,
        `"${p.purchaseDate}"`,
        `"${p.supplierName}"`,
        `"${p.supplierGstin}"`,
        p.taxableAmount,
        p.cgstTotal + p.sgstTotal + p.igstTotal,
        p.totalAmount,
        p.balanceDue,
        `"${p.paymentStatus}"`,
      ]);
    } else if (selectedReport === 'debtors') {
      headers = ['Customer ID', 'Name', 'Company', 'GSTIN', 'Mobile', 'Credit Limit', 'Outstanding Due'];
      rows = debtorsData.map(d => [
        `"${d.customerId}"`,
        `"${d.name}"`,
        `"${d.companyName}"`,
        `"${d.gstin}"`,
        `"${d.mobile}"`,
        d.creditLimit,
        d.currentBalance,
      ]);
    } else if (selectedReport === 'creditors') {
      headers = ['Supplier ID', 'Company', 'GSTIN', 'Mobile', 'Payable Due'];
      rows = creditorsData.map(c => [
        `"${c.supplierId}"`,
        `"${c.companyName}"`,
        `"${c.gstin}"`,
        `"${c.mobile}"`,
        c.currentBalance,
      ]);
    } else if (selectedReport === 'inventory') {
      headers = ['SKU', 'Product Name', 'HSN', 'Cost Price', 'Selling Price', 'Current Stock', 'Stock Value'];
      rows = inventoryData.map(p => [
        `"${p.sku}"`,
        `"${p.name}"`,
        `"${p.hsnSac}"`,
        p.purchasePrice,
        p.sellingPrice,
        p.currentStock,
        p.currentStock * p.purchasePrice,
      ]);
    } else if (selectedReport === 'hsn') {
      headers = ['HSN/SAC', 'Product Description', 'Total Quantity Sold', 'Taxable Turnover'];
      rows = hsnData.map(h => [`"${h.hsn}"`, `"${h.name}"`, h.qty, h.value]);
    } else {
      headers = ['Type', 'Ref #', 'Party', 'Inflow', 'Outflow'];
      rows = daybookData.map(d => [`"${d.type}"`, `"${d.ref}"`, `"${d.party}"`, d.in, d.out]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Report exported successfully to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Report Selector Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-lg text-xs">
          {(
            [
              { id: 'sales', label: 'Sales Register' },
              { id: 'purchases', label: 'Purchase Register' },
              { id: 'debtors', label: 'Customer Debtors' },
              { id: 'creditors', label: 'Supplier Creditors' },
              { id: 'inventory', label: 'Inventory Valuation' },
              { id: 'hsn', label: 'HSN/SAC Sales' },
              { id: 'daybook', label: 'Daily Daybook' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                selectedReport === tab.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selectedReport === 'daybook' && (
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-mono"
            />
          )}

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Content Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {selectedReport === 'sales' && (
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider text-[11px] font-sans">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Taxable</th>
                  <th className="p-3 text-right">Total (₹)</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesData.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{i.invoiceNumber}</td>
                    <td className="p-3 text-slate-600">{i.invoiceDate}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{i.customerName}</td>
                    <td className="p-3 text-right">{formatINR(i.taxableAmount)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatINR(i.totalAmount)}</td>
                    <td className="p-3 text-right text-emerald-700">{formatINR(i.amountPaid)}</td>
                    <td className="p-3 text-right text-rose-600 font-semibold">{formatINR(i.balanceDue)}</td>
                    <td className="p-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-medium">
                        {i.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'purchases' && (
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider text-[11px] font-sans">
                <tr>
                  <th className="p-3">Bill #</th>
                  <th className="p-3">Vendor Bill #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Taxable</th>
                  <th className="p-3 text-right">Total (₹)</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{p.billNumber}</td>
                    <td className="p-3 text-slate-600">{p.vendorBillNumber || '-'}</td>
                    <td className="p-3 text-slate-600">{p.purchaseDate}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{p.supplierName}</td>
                    <td className="p-3 text-right">{formatINR(p.taxableAmount)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">{formatINR(p.totalAmount)}</td>
                    <td className="p-3 text-right text-amber-700 font-semibold">{formatINR(p.balanceDue)}</td>
                    <td className="p-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-medium">
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'debtors' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Customer ID</th>
                  <th className="p-3">Customer / Company</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Credit Limit</th>
                  <th className="p-3 text-right">Outstanding Receivable (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {debtorsData.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold">{d.customerId}</td>
                    <td className="p-3 font-semibold text-slate-900">{d.companyName || d.name}</td>
                    <td className="p-3 font-mono text-[11px]">{d.gstin || 'Unregistered'}</td>
                    <td className="p-3 font-mono text-[11px]">{d.mobile || '-'}</td>
                    <td className="p-3 text-right font-mono">{formatINR(d.creditLimit)}</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">
                      {formatINR(d.currentBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'creditors' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Supplier ID</th>
                  <th className="p-3">Supplier / Vendor</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Pending Payable Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditorsData.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold">{c.supplierId}</td>
                    <td className="p-3 font-semibold text-slate-900">{c.companyName || c.name}</td>
                    <td className="p-3 font-mono text-[11px]">{c.gstin || 'Unregistered'}</td>
                    <td className="p-3 font-mono text-[11px]">{c.mobile || '-'}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">
                      {formatINR(c.currentBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'inventory' && (
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider text-[11px] font-sans">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">HSN Code</th>
                  <th className="p-3 text-right">Cost Price</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-right">Asset Valuation (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryData.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold">{p.sku}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{p.name}</td>
                    <td className="p-3">{p.hsnSac}</td>
                    <td className="p-3 text-right">{formatINR(p.purchasePrice)}</td>
                    <td className="p-3 text-right text-emerald-700 font-semibold">{formatINR(p.sellingPrice)}</td>
                    <td className="p-3 text-center font-bold">
                      {p.currentStock} {p.unit}
                    </td>
                    <td className="p-3 text-right font-bold text-indigo-700">
                      {formatINR(p.currentStock * p.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'hsn' && (
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider text-[11px] font-sans">
                <tr>
                  <th className="p-3">HSN / SAC Code</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Total Quantity Dispatched</th>
                  <th className="p-3 text-right">Taxable Turnover Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hsnData.map(h => (
                  <tr key={h.hsn} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{h.hsn}</td>
                    <td className="p-3 font-sans font-medium text-slate-800">{h.name}</td>
                    <td className="p-3 text-center font-bold">{h.qty}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatINR(h.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'daybook' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Voucher / Ref #</th>
                  <th className="p-3">Party / Particulars</th>
                  <th className="p-3 text-right">Inflow (₹)</th>
                  <th className="p-3 text-right">Outflow (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daybookData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No financial transactions recorded on {dateFilter}.
                    </td>
                  </tr>
                ) : (
                  daybookData.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-800">{d.type}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{d.ref}</td>
                      <td className="p-3 text-slate-700">{d.party}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">
                        {d.in > 0 ? formatINR(d.in) : '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">
                        {d.out > 0 ? formatINR(d.out) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
