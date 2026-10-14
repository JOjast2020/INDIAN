import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Building,
  CreditCard,
  Download,
  IndianRupee,
  PiggyBank,
  Plus,
  QrCode,
  Search,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Account } from '../../types';
import { formatINR } from '../../utils/indianGST';

interface CashBankListProps {
  onOpenTransferModal: () => void;
}

export const CashBankList: React.FC<CashBankListProps> = ({ onOpenTransferModal }) => {
  const { state, saveAccount, showToast } = useApp();
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'Cash' | 'Bank' | 'UPI'>('Bank');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccIfsc, setNewAccIfsc] = useState('');
  const [newAccOpening, setNewAccOpening] = useState<number>(0);

  // Synthesize running Daybook / Cash-Bank Ledger transactions
  const ledgerTransactions = useMemo(() => {
    interface Tx {
      id: string;
      date: string;
      accountId: string;
      accountName: string;
      description: string;
      type: 'IN' | 'OUT';
      amount: number;
    }

    const txs: Tx[] = [];

    // 1. Direct Income
    state.income.forEach(inc => {
      const acc = state.accounts.find(a => a.id === inc.accountId);
      txs.push({
        id: inc.id,
        date: inc.date,
        accountId: inc.accountId,
        accountName: acc?.name || 'Account',
        description: `Income: ${inc.category} - ${inc.description}`,
        type: 'IN',
        amount: inc.totalAmount,
      });
    });

    // 2. Customer Payments
    state.payments
      .filter(p => p.type === 'Customer Payment')
      .forEach(p => {
        const acc = state.accounts.find(a => a.id === p.accountId);
        txs.push({
          id: p.id,
          date: p.date,
          accountId: p.accountId,
          accountName: acc?.name || 'Account',
          description: `Customer Receipt: ${p.entityName} ${p.invoiceOrBillNumber ? `(${p.invoiceOrBillNumber})` : ''}`,
          type: 'IN',
          amount: p.amount,
        });
      });

    // 3. Expenses
    state.expenses.forEach(exp => {
      const acc = state.accounts.find(a => a.id === exp.accountId);
      txs.push({
        id: exp.id,
        date: exp.date,
        accountId: exp.accountId,
        accountName: acc?.name || 'Account',
        description: `Expense: ${exp.category} - ${exp.description}`,
        type: 'OUT',
        amount: exp.totalAmount,
      });
    });

    // 4. Supplier Payments
    state.payments
      .filter(p => p.type === 'Supplier Payment')
      .forEach(p => {
        const acc = state.accounts.find(a => a.id === p.accountId);
        txs.push({
          id: p.id,
          date: p.date,
          accountId: p.accountId,
          accountName: acc?.name || 'Account',
          description: `Vendor Disbursement: ${p.entityName} ${p.invoiceOrBillNumber ? `(${p.invoiceOrBillNumber})` : ''}`,
          type: 'OUT',
          amount: p.amount,
        });
      });

    // 5. Contra Transfers
    state.transfers.forEach(trf => {
      const fromAcc = state.accounts.find(a => a.id === trf.fromAccountId);
      const toAcc = state.accounts.find(a => a.id === trf.toAccountId);
      txs.push({
        id: `${trf.id}-out`,
        date: trf.date,
        accountId: trf.fromAccountId,
        accountName: fromAcc?.name || 'Source',
        description: `Contra Transfer OUT to ${toAcc?.name || 'Account'}`,
        type: 'OUT',
        amount: trf.amount,
      });
      txs.push({
        id: `${trf.id}-in`,
        date: trf.date,
        accountId: trf.toAccountId,
        accountName: toAcc?.name || 'Dest',
        description: `Contra Transfer IN from ${fromAcc?.name || 'Account'}`,
        type: 'IN',
        amount: trf.amount,
      });
    });

    // Sort by date descending
    txs.sort((a, b) => b.date.localeCompare(a.date));
    return txs;
  }, [state.income, state.expenses, state.payments, state.transfers, state.accounts]);

  const filteredLedger = useMemo(() => {
    if (selectedAccountFilter === 'all') return ledgerTransactions;
    return ledgerTransactions.filter(t => t.accountId === selectedAccountFilter);
  }, [ledgerTransactions, selectedAccountFilter]);

  const totalLiquidBalance = state.accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const newAcc: Account = {
      id: `ACC-${Date.now()}`,
      name: newAccName.trim(),
      type: newAccType,
      bankName: newAccBank.trim(),
      accountNumber: newAccNumber.trim(),
      ifscCode: newAccIfsc.trim().toUpperCase(),
      openingBalance: Number(newAccOpening) || 0,
      currentBalance: Number(newAccOpening) || 0,
    };

    saveAccount(newAcc);
    setShowAddAccountModal(false);
    setNewAccName('');
    setNewAccNumber('');
    setNewAccIfsc('');
    setNewAccBank('');
    setNewAccOpening(0);
  };

  const handleExportCSV = () => {
    if (filteredLedger.length === 0) {
      showToast('No ledger transactions to export', 'info');
      return;
    }
    const headers = ['Date', 'Account', 'Description', 'Flow Type', 'Inflow (Credit)', 'Outflow (Debit)'];
    const rows = filteredLedger.map(t => [
      `"${t.date}"`,
      `"${t.accountName}"`,
      `"${t.description}"`,
      `"${t.type}"`,
      t.type === 'IN' ? t.amount : 0,
      t.type === 'OUT' ? t.amount : 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cash_Bank_Book_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Cash & Bank book exported.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">
            Consolidated Treasury & Liquid Balances
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-1">
            {formatINR(totalLiquidBalance)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {state.accounts.length} bank, cash and digital payment accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransferModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Contra Transfer</span>
          </button>

          <button
            onClick={() => setShowAddAccountModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {state.accounts.map(acc => (
          <div
            key={acc.id}
            onClick={() => setSelectedAccountFilter(acc.id === selectedAccountFilter ? 'all' : acc.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              selectedAccountFilter === acc.id
                ? 'bg-indigo-50/60 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {acc.type}
              </span>
              {acc.type === 'Bank' ? (
                <Building className="w-4 h-4 text-blue-600" />
              ) : acc.type === 'Cash' ? (
                <Wallet className="w-4 h-4 text-emerald-600" />
              ) : (
                <QrCode className="w-4 h-4 text-purple-600" />
              )}
            </div>

            <div className="mt-2">
              <h4 className="text-xs font-bold text-slate-900 truncate">{acc.name}</h4>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                {acc.accountNumber ? `A/C: ${acc.accountNumber}` : acc.type}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Balance:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatINR(acc.currentBalance)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Cash Book / Bank Book Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Cash & Bank Book Ledger</span>
              {selectedAccountFilter !== 'all' && (
                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-mono">
                  Filtered Account
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">Chronological inward and outward cash movements</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAccountFilter}
              onChange={e => setSelectedAccountFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 outline-hidden"
            >
              <option value="all">All Accounts (Consolidated)</option>
              {state.accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Particulars / Source</th>
                <th className="px-4 py-3 text-right">Inflow (Credit +)</th>
                <th className="px-4 py-3 text-right">Outflow (Debit -)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    No transactions recorded for selected scope.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx, idx) => (
                  <tr key={`${tx.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{tx.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{tx.accountName.split('(')[0]}</td>
                    <td className="px-4 py-3 text-slate-900">{tx.description}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      {tx.type === 'IN' ? formatINR(tx.amount) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                      {tx.type === 'OUT' ? formatINR(tx.amount) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Add Bank or Cash Account</h3>
              <button onClick={() => setShowAddAccountModal(false)} className="p-1 text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Display Name</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  placeholder="e.g. ICICI Current Account"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Account Type</label>
                <select
                  value={newAccType}
                  onChange={e => setNewAccType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
                >
                  <option value="Bank">Bank Account</option>
                  <option value="Cash">Physical Cash Drawer</option>
                  <option value="UPI">UPI Merchant Wallet</option>
                </select>
              </div>

              {newAccType === 'Bank' && (
                <>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={newAccBank}
                      onChange={e => setNewAccBank(e.target.value)}
                      placeholder="ICICI Bank"
                      className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Account Number</label>
                    <input
                      type="text"
                      value={newAccNumber}
                      onChange={e => setNewAccNumber(e.target.value)}
                      placeholder="99201938102"
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={newAccIfsc}
                      onChange={e => setNewAccIfsc(e.target.value.toUpperCase())}
                      placeholder="ICIC0000102"
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase text-slate-900 bg-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={newAccOpening}
                  onChange={e => setNewAccOpening(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-slate-900 bg-white"
                  placeholder="0"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
