import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Account,
  AccountTransfer,
  AuditLog,
  BusinessSettings,
  CreditNote,
  Customer,
  DebitNote,
  Expense,
  Income,
  Invoice,
  PaymentMethod,
  PaymentRecord,
  Product,
  PurchaseBill,
  Quotation,
  RecurringInvoice,
  Supplier,
  User,
  UserRole,
} from '../types';
import { calculateGST, getFinancialYear } from '../utils/indianGST';
import {
  AppState,
  createAuditEntry,
  getStoredLoginStatus,
  loadAppState,
  resetDemoState,
  saveAllState,
  setStoredLoginStatus,
} from '../utils/storage';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  state: AppState;
  currentUser: User;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  setCurrentUserId: (id: string) => void;
  updateSettings: (settings: BusinessSettings) => void;
  // Invoices
  saveInvoice: (invoice: Invoice, paymentRecord?: { amount: number; method: PaymentMethod; accountId: string }) => void;
  deleteInvoice: (id: string) => void;
  cancelInvoice: (id: string, reason: string) => void;
  // Quotations
  saveQuotation: (quotation: Quotation) => void;
  deleteQuotation: (id: string) => void;
  convertQuotationToInvoice: (quotationId: string) => Invoice;
  getNextQuotationNumber: () => string;
  // Purchases
  savePurchase: (bill: PurchaseBill, paymentRecord?: { amount: number; method: PaymentMethod; accountId: string }) => void;
  deletePurchase: (id: string) => void;
  cancelPurchase: (id: string, reason: string) => void;
  // Income & Expenses
  saveIncome: (income: Income) => void;
  deleteIncome: (id: string) => void;
  saveExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  // Payments
  recordPayment: (payment: PaymentRecord) => void;
  savePayment: (payment: PaymentRecord) => void;
  deletePayment: (id: string) => void;
  // Accounts & Transfers
  saveAccount: (account: Account) => void;
  recordTransfer: (transfer: AccountTransfer) => void;
  // Customers & Suppliers
  saveCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  saveSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  // Products
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  // Credit & Debit Notes
  saveCreditNote: (cn: CreditNote) => void;
  deleteCreditNote: (id: string) => void;
  saveDebitNote: (dn: DebitNote) => void;
  deleteDebitNote: (id: string) => void;
  // Recurring
  saveRecurring: (rec: RecurringInvoice) => void;
  deleteRecurring: (id: string) => void;
  generateRecurringInvoices: () => number;
  // Users
  saveUser: (user: User) => void;
  // System
  backupData: () => string;
  restoreData: (jsonStr: string) => boolean;
  resetToDemo: () => void;
  // Auth
  isLoggedIn: boolean;
  login: (usernameOrEmail: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  credentialsModalOpen: boolean;
  setCredentialsModalOpen: (open: boolean) => void;
  // Helper getters
  getNextInvoiceNumber: () => string;
  getNextPurchaseNumber: () => string;
  getNextPaymentNumber: (type: 'Customer Payment' | 'Supplier Payment') => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => getStoredLoginStatus());
  const [credentialsModalOpen, setCredentialsModalOpen] = useState<boolean>(false);

  // Keep state synced with localStorage
  useEffect(() => {
    saveAllState(state);
  }, [state]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const currentUser = state.users.find(u => u.id === state.currentUserId) || state.users[0];

  const setCurrentUserId = (id: string) => {
    setState(prev => {
      const targetUser = prev.users.find(u => u.id === id);
      if (!targetUser) return prev;
      const log = createAuditEntry(
        targetUser,
        'SWITCH_USER',
        'Auth',
        `Active user switched to ${targetUser.name} (${targetUser.role})`
      );
      return {
        ...prev,
        currentUserId: id,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Switched active user to ${currentUser.name}`);
  };

  const login = (usernameOrEmail: string, pass: string): { success: boolean; message?: string } => {
    const trimmedInput = usernameOrEmail.trim().toLowerCase();
    const target = state.users.find(
      u =>
        u.email?.toLowerCase() === trimmedInput ||
        u.username?.toLowerCase() === trimmedInput ||
        u.name?.toLowerCase() === trimmedInput
    );

    if (!target) {
      return {
        success: false,
        message: 'User not found. Use "rooban" or "admin@mr.farmercorp.in"',
      };
    }

    if (target.password && target.password !== pass) {
      return {
        success: false,
        message: 'Invalid password. Hint: Rooban@123',
      };
    }

    setIsLoggedIn(true);
    setStoredLoginStatus(true);
    setCurrentUserId(target.id);
    const log = createAuditEntry(
      target,
      'LOGIN',
      'Auth',
      `Super Admin ${target.name} authenticated successfully.`
    );
    setState(prev => ({
      ...prev,
      auditLogs: [log, ...prev.auditLogs],
    }));
    showToast(`Welcome back, ${target.name}! Authenticated as ${target.role}.`);
    return { success: true };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setStoredLoginStatus(false);
    showToast('Session locked. Please sign in to resume.', 'info');
  };

  const updateSettings = (settings: BusinessSettings) => {
    setState(prev => {
      const log = createAuditEntry(currentUser, 'UPDATE_SETTINGS', 'Settings', 'Updated business profile and billing configurations.');
      return {
        ...prev,
        settings,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Business & Tax settings saved successfully.');
  };

  const getNextInvoiceNumber = (): string => {
    const fy = getFinancialYear();
    const count = state.invoices.length + 1;
    const padNum = count.toString().padStart(4, '0');
    return `${state.settings.invoicePrefix}/${fy}/${padNum}`;
  };

  const getNextPurchaseNumber = (): string => {
    const fy = getFinancialYear();
    const count = state.purchases.length + 1;
    const padNum = count.toString().padStart(4, '0');
    return `${state.settings.purchasePrefix}/${fy}/${padNum}`;
  };

  const getNextPaymentNumber = (type: 'Customer Payment' | 'Supplier Payment'): string => {
    const prefix = type === 'Customer Payment' ? 'REC' : 'PAY';
    const count = state.payments.filter(p => p.type === type).length + 1;
    const padNum = count.toString().padStart(4, '0');
    return `${prefix}-${padNum}`;
  };

  const saveInvoice = (
    invoice: Invoice,
    paymentRecord?: { amount: number; method: PaymentMethod; accountId: string }
  ) => {
    setState(prev => {
      const existingInv = prev.invoices.find(inv => inv.id === invoice.id);
      const isExisting = !!existingInv;
      let updatedInvoices = [...prev.invoices];
      let updatedProducts = [...prev.products];
      let updatedCustomers = [...prev.customers];
      let updatedAccounts = [...prev.accounts];
      let updatedPayments = [...prev.payments];

      // If existing invoice was updated, first revert previous inventory deductions (if not cancelled)
      if (isExisting && existingInv && existingInv.paymentStatus !== 'Cancelled') {
        existingInv.items.forEach(oldItem => {
          const prodIdx = updatedProducts.findIndex(p => p.id === oldItem.productId);
          if (prodIdx >= 0 && updatedProducts[prodIdx].type === 'Product') {
            updatedProducts[prodIdx] = {
              ...updatedProducts[prodIdx],
              currentStock: updatedProducts[prodIdx].currentStock + oldItem.quantity,
            };
          }
        });
      }

      // Deduct inventory for current invoice items (if not cancelled)
      if (invoice.paymentStatus !== 'Cancelled') {
        invoice.items.forEach(item => {
          const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
          if (prodIdx >= 0 && updatedProducts[prodIdx].type === 'Product') {
            const current = updatedProducts[prodIdx].currentStock;
            updatedProducts[prodIdx] = {
              ...updatedProducts[prodIdx],
              currentStock: Math.max(0, current - item.quantity),
            };
          }
        });
      }

      // Handle initial payment if provided
      let finalInvoice = { ...invoice };
      if (paymentRecord && paymentRecord.amount > 0) {
        finalInvoice.amountPaid = Math.min(finalInvoice.totalAmount, finalInvoice.amountPaid + paymentRecord.amount);
        finalInvoice.balanceDue = Math.max(0, finalInvoice.totalAmount - finalInvoice.amountPaid);
        if (finalInvoice.balanceDue <= 0) {
          finalInvoice.paymentStatus = 'Paid';
        } else if (finalInvoice.amountPaid > 0) {
          finalInvoice.paymentStatus = 'Partially Paid';
        }

        const newPayRecord: PaymentRecord = {
          id: `PAY-${Date.now()}`,
          paymentNumber: `REC-${(updatedPayments.length + 1).toString().padStart(4, '0')}`,
          type: 'Customer Payment',
          entityId: invoice.customerId,
          entityName: invoice.customerName,
          invoiceOrBillId: invoice.id,
          invoiceOrBillNumber: invoice.invoiceNumber,
          date: invoice.invoiceDate,
          amount: paymentRecord.amount,
          paymentMethod: paymentRecord.method,
          accountId: paymentRecord.accountId,
          notes: `Initial payment received for invoice ${invoice.invoiceNumber}`,
          createdAt: new Date().toISOString(),
        };
        updatedPayments = [newPayRecord, ...updatedPayments];

        // Credit the chosen account
        const accIdx = updatedAccounts.findIndex(a => a.id === paymentRecord.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance + paymentRecord.amount,
          };
        }
      }

      // Customer outstanding balance update
      const custIdx = updatedCustomers.findIndex(c => c.id === invoice.customerId);
      if (custIdx >= 0) {
        const cust = updatedCustomers[custIdx];
        if (!isExisting) {
          updatedCustomers[custIdx] = {
            ...cust,
            currentBalance: cust.currentBalance + finalInvoice.balanceDue,
          };
        } else if (existingInv) {
          // Adjust difference in balance due
          const oldDue = existingInv.paymentStatus === 'Cancelled' ? 0 : existingInv.balanceDue;
          const newDue = finalInvoice.paymentStatus === 'Cancelled' ? 0 : finalInvoice.balanceDue;
          updatedCustomers[custIdx] = {
            ...cust,
            currentBalance: Math.max(0, cust.currentBalance - oldDue + newDue),
          };
        }
      }

      if (isExisting) {
        updatedInvoices = updatedInvoices.map(inv => (inv.id === finalInvoice.id ? finalInvoice : inv));
      } else {
        updatedInvoices = [finalInvoice, ...updatedInvoices];
      }

      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_INVOICE' : 'CREATE_INVOICE',
        'Invoices',
        `${isExisting ? 'Updated' : 'Generated'} Invoice ${finalInvoice.invoiceNumber} for ${finalInvoice.customerName} - Total: ₹${finalInvoice.totalAmount.toLocaleString('en-IN')}`
      );

      return {
        ...prev,
        invoices: updatedInvoices,
        products: updatedProducts,
        customers: updatedCustomers,
        accounts: updatedAccounts,
        payments: updatedPayments,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Invoice ${invoice.invoiceNumber} saved successfully.`);
  };

  const deleteInvoice = (id: string) => {
    setState(prev => {
      const inv = prev.invoices.find(i => i.id === id);
      if (!inv) return prev;

      // Revert product stock if it was not already cancelled
      let updatedProducts = [...prev.products];
      if (inv.paymentStatus !== 'Cancelled') {
        updatedProducts = updatedProducts.map(p => {
          const item = inv.items.find(it => it.productId === p.id);
          if (item && p.type === 'Product') {
            return { ...p, currentStock: p.currentStock + item.quantity };
          }
          return p;
        });
      }

      // Revert customer outstanding balance
      let updatedCustomers = [...prev.customers];
      if (inv.paymentStatus !== 'Cancelled') {
        const custIdx = updatedCustomers.findIndex(c => c.id === inv.customerId);
        if (custIdx >= 0) {
          updatedCustomers[custIdx] = {
            ...updatedCustomers[custIdx],
            currentBalance: Math.max(0, updatedCustomers[custIdx].currentBalance - inv.balanceDue),
          };
        }
      }

      const updatedInvoices = prev.invoices.filter(i => i.id !== id);

      const log = createAuditEntry(
        currentUser,
        'DELETE_INVOICE',
        'Invoices',
        `Permanently deleted Invoice ${inv.invoiceNumber} for ${inv.customerName} (₹${inv.totalAmount.toLocaleString('en-IN')})`
      );

      return {
        ...prev,
        invoices: updatedInvoices,
        products: updatedProducts,
        customers: updatedCustomers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Invoice deleted successfully.');
  };

  const cancelInvoice = (id: string, reason: string) => {
    setState(prev => {
      const inv = prev.invoices.find(i => i.id === id);
      if (!inv || inv.paymentStatus === 'Cancelled') return prev;

      // Restore stock
      const updatedProducts = prev.products.map(p => {
        const item = inv.items.find(it => it.productId === p.id);
        if (item && p.type === 'Product') {
          return { ...p, currentStock: p.currentStock + item.quantity };
        }
        return p;
      });

      // Adjust customer balance
      const updatedCustomers = prev.customers.map(c => {
        if (c.id === inv.customerId) {
          return { ...c, currentBalance: Math.max(0, c.currentBalance - inv.balanceDue) };
        }
        return c;
      });

      const updatedInvoices = prev.invoices.map(i =>
        i.id === id ? { ...i, paymentStatus: 'Cancelled' as const, cancelledReason: reason, balanceDue: 0 } : i
      );

      const log = createAuditEntry(
        currentUser,
        'VOID_INVOICE',
        'Invoices',
        `Cancelled invoice ${inv.invoiceNumber}. Reason: ${reason}`
      );

      return {
        ...prev,
        invoices: updatedInvoices,
        products: updatedProducts,
        customers: updatedCustomers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Invoice cancelled / voided.`);
  };

  const savePurchase = (
    bill: PurchaseBill,
    paymentRecord?: { amount: number; method: PaymentMethod; accountId: string }
  ) => {
    setState(prev => {
      const existingBill = prev.purchases.find(p => p.id === bill.id);
      const isExisting = !!existingBill;
      let updatedPurchases = [...prev.purchases];
      let updatedProducts = [...prev.products];
      let updatedSuppliers = [...prev.suppliers];
      let updatedAccounts = [...prev.accounts];
      let updatedPayments = [...prev.payments];

      // If existing bill was edited, first revert stock added previously (if not cancelled)
      if (isExisting && existingBill && existingBill.paymentStatus !== 'Cancelled') {
        existingBill.items.forEach(oldItem => {
          const prodIdx = updatedProducts.findIndex(p => p.id === oldItem.productId);
          if (prodIdx >= 0 && updatedProducts[prodIdx].type === 'Product') {
            updatedProducts[prodIdx] = {
              ...updatedProducts[prodIdx],
              currentStock: Math.max(0, updatedProducts[prodIdx].currentStock - oldItem.quantity),
            };
          }
        });
      }

      // Add stock for current purchase items (if not cancelled)
      if (bill.paymentStatus !== 'Cancelled') {
        bill.items.forEach(item => {
          const prodIdx = updatedProducts.findIndex(p => p.id === item.productId);
          if (prodIdx >= 0 && updatedProducts[prodIdx].type === 'Product') {
            updatedProducts[prodIdx] = {
              ...updatedProducts[prodIdx],
              currentStock: updatedProducts[prodIdx].currentStock + item.quantity,
              purchasePrice: item.purchaseRate || updatedProducts[prodIdx].purchasePrice,
            };
          }
        });
      }

      let finalBill = { ...bill };
      if (paymentRecord && paymentRecord.amount > 0) {
        finalBill.amountPaid = Math.min(finalBill.totalAmount, finalBill.amountPaid + paymentRecord.amount);
        finalBill.balanceDue = Math.max(0, finalBill.totalAmount - finalBill.amountPaid);
        if (finalBill.balanceDue <= 0) {
          finalBill.paymentStatus = 'Paid';
        } else if (finalBill.amountPaid > 0) {
          finalBill.paymentStatus = 'Partially Paid';
        }

        const newPayRecord: PaymentRecord = {
          id: `PAY-${Date.now()}`,
          paymentNumber: `PAY-${(updatedPayments.length + 1).toString().padStart(4, '0')}`,
          type: 'Supplier Payment',
          entityId: bill.supplierId,
          entityName: bill.supplierName,
          invoiceOrBillId: bill.id,
          invoiceOrBillNumber: bill.billNumber,
          date: bill.purchaseDate,
          amount: paymentRecord.amount,
          paymentMethod: paymentRecord.method,
          accountId: paymentRecord.accountId,
          notes: `Initial payment for purchase bill ${bill.billNumber}`,
          createdAt: new Date().toISOString(),
        };
        updatedPayments = [newPayRecord, ...updatedPayments];

        // Debit the chosen account
        const accIdx = updatedAccounts.findIndex(a => a.id === paymentRecord.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance - paymentRecord.amount,
          };
        }
      }

      // Update supplier balance
      const supIdx = updatedSuppliers.findIndex(s => s.id === bill.supplierId);
      if (supIdx >= 0) {
        if (!isExisting) {
          updatedSuppliers[supIdx] = {
            ...updatedSuppliers[supIdx],
            currentBalance: updatedSuppliers[supIdx].currentBalance + finalBill.balanceDue,
          };
        } else if (existingBill) {
          const oldDue = existingBill.paymentStatus === 'Cancelled' ? 0 : existingBill.balanceDue;
          const newDue = finalBill.paymentStatus === 'Cancelled' ? 0 : finalBill.balanceDue;
          updatedSuppliers[supIdx] = {
            ...updatedSuppliers[supIdx],
            currentBalance: Math.max(0, updatedSuppliers[supIdx].currentBalance - oldDue + newDue),
          };
        }
      }

      if (isExisting) {
        updatedPurchases = updatedPurchases.map(b => (b.id === finalBill.id ? finalBill : b));
      } else {
        updatedPurchases = [finalBill, ...updatedPurchases];
      }

      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_PURCHASE' : 'CREATE_PURCHASE',
        'Purchases',
        `${isExisting ? 'Updated' : 'Recorded'} Purchase Bill ${finalBill.billNumber} from ${finalBill.supplierName} - Total: ₹${finalBill.totalAmount.toLocaleString('en-IN')}`
      );

      return {
        ...prev,
        purchases: updatedPurchases,
        products: updatedProducts,
        suppliers: updatedSuppliers,
        accounts: updatedAccounts,
        payments: updatedPayments,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Purchase bill ${bill.billNumber} saved successfully.`);
  };

  const deletePurchase = (id: string) => {
    setState(prev => {
      const bill = prev.purchases.find(p => p.id === id);
      if (!bill) return prev;

      // Revert product stock if not cancelled
      let updatedProducts = [...prev.products];
      if (bill.paymentStatus !== 'Cancelled') {
        updatedProducts = updatedProducts.map(p => {
          const item = bill.items.find(it => it.productId === p.id);
          if (item && p.type === 'Product') {
            return { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) };
          }
          return p;
        });
      }

      // Revert supplier balance
      let updatedSuppliers = [...prev.suppliers];
      if (bill.paymentStatus !== 'Cancelled') {
        const supIdx = updatedSuppliers.findIndex(s => s.id === bill.supplierId);
        if (supIdx >= 0) {
          updatedSuppliers[supIdx] = {
            ...updatedSuppliers[supIdx],
            currentBalance: Math.max(0, updatedSuppliers[supIdx].currentBalance - bill.balanceDue),
          };
        }
      }

      const updatedPurchases = prev.purchases.filter(p => p.id !== id);

      const log = createAuditEntry(
        currentUser,
        'DELETE_PURCHASE',
        'Purchases',
        `Permanently deleted Purchase Bill ${bill.billNumber} from ${bill.supplierName} (₹${bill.totalAmount.toLocaleString('en-IN')})`
      );

      return {
        ...prev,
        purchases: updatedPurchases,
        products: updatedProducts,
        suppliers: updatedSuppliers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Purchase bill deleted successfully.');
  };

  const cancelPurchase = (id: string, reason: string) => {
    setState(prev => {
      const bill = prev.purchases.find(p => p.id === id);
      if (!bill || bill.paymentStatus === 'Cancelled') return prev;

      // Revert product stock
      const updatedProducts = prev.products.map(p => {
        const item = bill.items.find(it => it.productId === p.id);
        if (item && p.type === 'Product') {
          return { ...p, currentStock: Math.max(0, p.currentStock - item.quantity) };
        }
        return p;
      });

      // Revert supplier balance
      const updatedSuppliers = prev.suppliers.map(s => {
        if (s.id === bill.supplierId) {
          return { ...s, currentBalance: Math.max(0, s.currentBalance - bill.balanceDue) };
        }
        return s;
      });

      const updatedPurchases = prev.purchases.map(b =>
        b.id === id ? { ...b, paymentStatus: 'Cancelled' as const, cancelledReason: reason, balanceDue: 0 } : b
      );

      const log = createAuditEntry(
        currentUser,
        'VOID_PURCHASE',
        'Purchases',
        `Cancelled Purchase Bill ${bill.billNumber}. Reason: ${reason}`
      );

      return {
        ...prev,
        purchases: updatedPurchases,
        products: updatedProducts,
        suppliers: updatedSuppliers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Purchase bill cancelled.`);
  };

  const saveIncome = (income: Income) => {
    setState(prev => {
      const isExisting = prev.income.some(i => i.id === income.id);
      let updatedIncome = [...prev.income];
      let updatedAccounts = [...prev.accounts];

      if (isExisting) {
        updatedIncome = updatedIncome.map(i => (i.id === income.id ? income : i));
      } else {
        updatedIncome = [income, ...updatedIncome];
        // Credit the account
        const accIdx = updatedAccounts.findIndex(a => a.id === income.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance + income.totalAmount,
          };
        }
      }

      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_INCOME' : 'CREATE_INCOME',
        'Income',
        `Recorded non-invoice income of ₹${income.totalAmount.toLocaleString('en-IN')} (${income.category})`
      );

      return {
        ...prev,
        income: updatedIncome,
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Income recorded successfully.`);
  };

  const deleteIncome = (id: string) => {
    setState(prev => {
      const item = prev.income.find(i => i.id === id);
      if (!item) return prev;
      const updatedAccounts = prev.accounts.map(a =>
        a.id === item.accountId ? { ...a, currentBalance: a.currentBalance - item.totalAmount } : a
      );
      const log = createAuditEntry(
        currentUser,
        'DELETE_INCOME',
        'Income',
        `Removed income entry ${item.incomeNumber} of ₹${item.totalAmount.toLocaleString('en-IN')}`
      );
      return {
        ...prev,
        income: prev.income.filter(i => i.id !== id),
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Income entry removed.');
  };

  const saveExpense = (expense: Expense) => {
    setState(prev => {
      const isExisting = prev.expenses.some(e => e.id === expense.id);
      let updatedExpenses = [...prev.expenses];
      let updatedAccounts = [...prev.accounts];

      if (isExisting) {
        updatedExpenses = updatedExpenses.map(e => (e.id === expense.id ? expense : e));
      } else {
        updatedExpenses = [expense, ...updatedExpenses];
        // Debit the account
        const accIdx = updatedAccounts.findIndex(a => a.id === expense.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance - expense.totalAmount,
          };
        }
      }

      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_EXPENSE' : 'CREATE_EXPENSE',
        'Expenses',
        `Recorded business expense of ₹${expense.totalAmount.toLocaleString('en-IN')} (${expense.category})`
      );

      return {
        ...prev,
        expenses: updatedExpenses,
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Expense recorded successfully.`);
  };

  const deleteExpense = (id: string) => {
    setState(prev => {
      const item = prev.expenses.find(e => e.id === id);
      if (!item) return prev;
      const updatedAccounts = prev.accounts.map(a =>
        a.id === item.accountId ? { ...a, currentBalance: a.currentBalance + item.totalAmount } : a
      );
      const log = createAuditEntry(
        currentUser,
        'DELETE_EXPENSE',
        'Expenses',
        `Removed expense entry ${item.expenseNumber} of ₹${item.totalAmount.toLocaleString('en-IN')}`
      );
      return {
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id),
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Expense entry deleted.');
  };

  const recordPayment = (payment: PaymentRecord) => {
    setState(prev => {
      let updatedInvoices = [...prev.invoices];
      let updatedPurchases = [...prev.purchases];
      let updatedCustomers = [...prev.customers];
      let updatedSuppliers = [...prev.suppliers];
      let updatedAccounts = [...prev.accounts];

      if (payment.type === 'Customer Payment') {
        // Customer paid money
        if (payment.invoiceOrBillId) {
          const invIdx = updatedInvoices.findIndex(i => i.id === payment.invoiceOrBillId);
          if (invIdx >= 0) {
            const inv = updatedInvoices[invIdx];
            const newPaid = inv.amountPaid + payment.amount;
            const newBal = Math.max(0, inv.totalAmount - newPaid);
            const status = newBal <= 0 ? 'Paid' : 'Partially Paid';
            updatedInvoices[invIdx] = {
              ...inv,
              amountPaid: newPaid,
              balanceDue: newBal,
              paymentStatus: status,
            };
          }
        }
        // Deduct from customer balance
        const custIdx = updatedCustomers.findIndex(c => c.id === payment.entityId);
        if (custIdx >= 0) {
          updatedCustomers[custIdx] = {
            ...updatedCustomers[custIdx],
            currentBalance: Math.max(0, updatedCustomers[custIdx].currentBalance - payment.amount),
          };
        }
        // Credit bank/cash
        const accIdx = updatedAccounts.findIndex(a => a.id === payment.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance + payment.amount,
          };
        }
      } else {
        // Supplier payment paid out
        if (payment.invoiceOrBillId) {
          const purIdx = updatedPurchases.findIndex(p => p.id === payment.invoiceOrBillId);
          if (purIdx >= 0) {
            const bill = updatedPurchases[purIdx];
            const newPaid = bill.amountPaid + payment.amount;
            const newBal = Math.max(0, bill.totalAmount - newPaid);
            const status = newBal <= 0 ? 'Paid' : 'Partially Paid';
            updatedPurchases[purIdx] = {
              ...bill,
              amountPaid: newPaid,
              balanceDue: newBal,
              paymentStatus: status,
            };
          }
        }
        // Deduct from supplier outstanding
        const supIdx = updatedSuppliers.findIndex(s => s.id === payment.entityId);
        if (supIdx >= 0) {
          updatedSuppliers[supIdx] = {
            ...updatedSuppliers[supIdx],
            currentBalance: Math.max(0, updatedSuppliers[supIdx].currentBalance - payment.amount),
          };
        }
        // Debit bank/cash
        const accIdx = updatedAccounts.findIndex(a => a.id === payment.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance - payment.amount,
          };
        }
      }

      const log = createAuditEntry(
        currentUser,
        'RECORD_PAYMENT',
        'Payments',
        `Recorded ${payment.type} ${payment.paymentNumber} of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.entityName}`
      );

      return {
        ...prev,
        payments: [payment, ...prev.payments],
        invoices: updatedInvoices,
        purchases: updatedPurchases,
        customers: updatedCustomers,
        suppliers: updatedSuppliers,
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Payment of ₹${payment.amount.toLocaleString('en-IN')} recorded successfully.`);
  };

  const savePayment = (payment: PaymentRecord) => {
    setState(prev => {
      const isExisting = prev.payments.some(p => p.id === payment.id);
      if (!isExisting) {
        // If brand new, delegating to recordPayment
        setTimeout(() => recordPayment(payment), 0);
        return prev;
      }
      const updatedPayments = prev.payments.map(p => (p.id === payment.id ? payment : p));
      const log = createAuditEntry(
        currentUser,
        'EDIT_PAYMENT',
        'Payments',
        `Updated payment voucher ${payment.paymentNumber} for ${payment.entityName}`
      );
      return {
        ...prev,
        payments: updatedPayments,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Payment voucher ${payment.paymentNumber} updated.`);
  };

  const deletePayment = (id: string) => {
    setState(prev => {
      const pmt = prev.payments.find(p => p.id === id);
      if (!pmt) return prev;

      let updatedInvoices = [...prev.invoices];
      let updatedPurchases = [...prev.purchases];
      let updatedCustomers = [...prev.customers];
      let updatedSuppliers = [...prev.suppliers];
      let updatedAccounts = [...prev.accounts];

      if (pmt.type === 'Customer Payment') {
        // Revert linked invoice
        if (pmt.invoiceOrBillId) {
          const invIdx = updatedInvoices.findIndex(i => i.id === pmt.invoiceOrBillId);
          if (invIdx >= 0) {
            const inv = updatedInvoices[invIdx];
            const newPaid = Math.max(0, inv.amountPaid - pmt.amount);
            const newBal = inv.totalAmount - newPaid;
            updatedInvoices[invIdx] = {
              ...inv,
              amountPaid: newPaid,
              balanceDue: newBal,
              paymentStatus: newBal <= 0 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid',
            };
          }
        }
        // Re-add to customer balance
        const custIdx = updatedCustomers.findIndex(c => c.id === pmt.entityId);
        if (custIdx >= 0) {
          updatedCustomers[custIdx] = {
            ...updatedCustomers[custIdx],
            currentBalance: updatedCustomers[custIdx].currentBalance + pmt.amount,
          };
        }
        // Debit account
        const accIdx = updatedAccounts.findIndex(a => a.id === pmt.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance - pmt.amount,
          };
        }
      } else {
        // Supplier Payment
        if (pmt.invoiceOrBillId) {
          const purIdx = updatedPurchases.findIndex(p => p.id === pmt.invoiceOrBillId);
          if (purIdx >= 0) {
            const bill = updatedPurchases[purIdx];
            const newPaid = Math.max(0, bill.amountPaid - pmt.amount);
            const newBal = bill.totalAmount - newPaid;
            updatedPurchases[purIdx] = {
              ...bill,
              amountPaid: newPaid,
              balanceDue: newBal,
              paymentStatus: newBal <= 0 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid',
            };
          }
        }
        // Re-add to supplier balance
        const supIdx = updatedSuppliers.findIndex(s => s.id === pmt.entityId);
        if (supIdx >= 0) {
          updatedSuppliers[supIdx] = {
            ...updatedSuppliers[supIdx],
            currentBalance: updatedSuppliers[supIdx].currentBalance + pmt.amount,
          };
        }
        // Credit account
        const accIdx = updatedAccounts.findIndex(a => a.id === pmt.accountId);
        if (accIdx >= 0) {
          updatedAccounts[accIdx] = {
            ...updatedAccounts[accIdx],
            currentBalance: updatedAccounts[accIdx].currentBalance + pmt.amount,
          };
        }
      }

      const updatedPayments = prev.payments.filter(p => p.id !== id);

      const log = createAuditEntry(
        currentUser,
        'DELETE_PAYMENT',
        'Payments',
        `Deleted ${pmt.type} voucher ${pmt.paymentNumber} for ${pmt.entityName} (₹${pmt.amount.toLocaleString('en-IN')})`
      );

      return {
        ...prev,
        payments: updatedPayments,
        invoices: updatedInvoices,
        purchases: updatedPurchases,
        customers: updatedCustomers,
        suppliers: updatedSuppliers,
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Payment voucher deleted successfully.');
  };

  const saveAccount = (account: Account) => {
    setState(prev => {
      const isExisting = prev.accounts.some(a => a.id === account.id);
      const updatedAccounts = isExisting
        ? prev.accounts.map(a => (a.id === account.id ? account : a))
        : [...prev.accounts, account];
      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_ACCOUNT' : 'CREATE_ACCOUNT',
        'Cash & Bank',
        `${isExisting ? 'Updated' : 'Added'} Account: ${account.name}`
      );
      return {
        ...prev,
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Account details updated.');
  };

  const recordTransfer = (transfer: AccountTransfer) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.map(acc => {
        if (acc.id === transfer.fromAccountId) {
          return { ...acc, currentBalance: acc.currentBalance - transfer.amount };
        }
        if (acc.id === transfer.toAccountId) {
          return { ...acc, currentBalance: acc.currentBalance + transfer.amount };
        }
        return acc;
      });

      const fromName = prev.accounts.find(a => a.id === transfer.fromAccountId)?.name || 'Source';
      const toName = prev.accounts.find(a => a.id === transfer.toAccountId)?.name || 'Destination';

      const log = createAuditEntry(
        currentUser,
        'CONTRA_TRANSFER',
        'Cash & Bank',
        `Transferred ₹${transfer.amount.toLocaleString('en-IN')} from ${fromName} to ${toName}`
      );

      return {
        ...prev,
        transfers: [transfer, ...prev.transfers],
        accounts: updatedAccounts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Transfer of ₹${transfer.amount.toLocaleString('en-IN')} completed.`);
  };

  const saveCustomer = (customer: Customer) => {
    setState(prev => {
      const isExisting = prev.customers.some(c => c.id === customer.id);
      const updatedCustomers = isExisting
        ? prev.customers.map(c => (c.id === customer.id ? customer : c))
        : [...prev.customers, customer];
      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_CUSTOMER' : 'CREATE_CUSTOMER',
        'Customers',
        `${isExisting ? 'Updated' : 'Created'} Customer: ${customer.companyName || customer.name}`
      );
      return {
        ...prev,
        customers: updatedCustomers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Customer saved successfully.');
  };

  const deleteCustomer = (id: string) => {
    setState(prev => {
      const cust = prev.customers.find(c => c.id === id);
      if (!cust) return prev;
      const log = createAuditEntry(currentUser, 'DELETE_CUSTOMER', 'Customers', `Removed customer: ${cust.name}`);
      return {
        ...prev,
        customers: prev.customers.filter(c => c.id !== id),
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Customer deleted.');
  };

  const saveSupplier = (supplier: Supplier) => {
    setState(prev => {
      const isExisting = prev.suppliers.some(s => s.id === supplier.id);
      const updatedSuppliers = isExisting
        ? prev.suppliers.map(s => (s.id === supplier.id ? supplier : s))
        : [...prev.suppliers, supplier];
      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_SUPPLIER' : 'CREATE_SUPPLIER',
        'Suppliers',
        `${isExisting ? 'Updated' : 'Created'} Supplier: ${supplier.companyName || supplier.name}`
      );
      return {
        ...prev,
        suppliers: updatedSuppliers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Supplier saved successfully.');
  };

  const deleteSupplier = (id: string) => {
    setState(prev => {
      const sup = prev.suppliers.find(s => s.id === id);
      if (!sup) return prev;
      const log = createAuditEntry(currentUser, 'DELETE_SUPPLIER', 'Suppliers', `Removed supplier: ${sup.name}`);
      return {
        ...prev,
        suppliers: prev.suppliers.filter(s => s.id !== id),
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Supplier deleted.');
  };

  const saveProduct = (product: Product) => {
    setState(prev => {
      const isExisting = prev.products.some(p => p.id === product.id);
      const updatedProducts = isExisting
        ? prev.products.map(p => (p.id === product.id ? product : p))
        : [...prev.products, product];
      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_PRODUCT' : 'CREATE_PRODUCT',
        'Products',
        `${isExisting ? 'Updated' : 'Created'} Product/Service: ${product.name} (${product.sku})`
      );
      return {
        ...prev,
        products: updatedProducts,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Product / Service saved successfully.');
  };

  const deleteProduct = (id: string) => {
    setState(prev => {
      const prod = prev.products.find(p => p.id === id);
      if (!prod) return prev;
      const log = createAuditEntry(currentUser, 'DELETE_PRODUCT', 'Products', `Removed product: ${prod.name}`);
      return {
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Product deleted.');
  };

  const saveCreditNote = (cn: CreditNote) => {
    setState(prev => {
      const isExisting = prev.creditNotes.some(c => c.id === cn.id);
      const updatedNotes = isExisting
        ? prev.creditNotes.map(c => (c.id === cn.id ? cn : c))
        : [cn, ...prev.creditNotes];

      // Adjust customer balance if new
      let updatedCustomers = prev.customers;
      if (!isExisting) {
        updatedCustomers = prev.customers.map(c =>
          c.id === cn.customerId ? { ...c, currentBalance: Math.max(0, c.currentBalance - cn.totalAmount) } : c
        );
      }

      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_CREDIT_NOTE' : 'CREATE_CREDIT_NOTE',
        'Credit Notes',
        `${isExisting ? 'Updated' : 'Issued'} Credit Note ${cn.noteNumber} for ₹${cn.totalAmount.toLocaleString('en-IN')} against ${cn.originalInvoiceNumber}`
      );
      return {
        ...prev,
        creditNotes: updatedNotes,
        customers: updatedCustomers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Credit note ${cn.noteNumber} saved.`);
  };

  const deleteCreditNote = (id: string) => {
    setState(prev => {
      const cn = prev.creditNotes.find(c => c.id === id);
      if (!cn) return prev;
      const updatedCustomers = prev.customers.map(c =>
        c.id === cn.customerId ? { ...c, currentBalance: c.currentBalance + cn.totalAmount } : c
      );
      const updatedNotes = prev.creditNotes.filter(c => c.id !== id);
      const log = createAuditEntry(
        currentUser,
        'DELETE_CREDIT_NOTE',
        'Credit Notes',
        `Deleted Credit Note ${cn.noteNumber} for ₹${cn.totalAmount.toLocaleString('en-IN')}`
      );
      return {
        ...prev,
        creditNotes: updatedNotes,
        customers: updatedCustomers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Credit note deleted.');
  };

  const saveDebitNote = (dn: DebitNote) => {
    setState(prev => {
      const isExisting = prev.debitNotes.some(d => d.id === dn.id);
      const updatedNotes = isExisting
        ? prev.debitNotes.map(d => (d.id === dn.id ? dn : d))
        : [dn, ...prev.debitNotes];

      // Adjust supplier balance if new
      let updatedSuppliers = prev.suppliers;
      if (!isExisting) {
        updatedSuppliers = prev.suppliers.map(s =>
          s.id === dn.supplierId ? { ...s, currentBalance: Math.max(0, s.currentBalance - dn.totalAmount) } : s
        );
      }

      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_DEBIT_NOTE' : 'CREATE_DEBIT_NOTE',
        'Debit Notes',
        `${isExisting ? 'Updated' : 'Issued'} Debit Note ${dn.noteNumber} for ₹${dn.totalAmount.toLocaleString('en-IN')} against ${dn.originalBillNumber}`
      );
      return {
        ...prev,
        debitNotes: updatedNotes,
        suppliers: updatedSuppliers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Debit note ${dn.noteNumber} saved.`);
  };

  const deleteDebitNote = (id: string) => {
    setState(prev => {
      const dn = prev.debitNotes.find(d => d.id === id);
      if (!dn) return prev;
      const updatedSuppliers = prev.suppliers.map(s =>
        s.id === dn.supplierId ? { ...s, currentBalance: s.currentBalance + dn.totalAmount } : s
      );
      const updatedNotes = prev.debitNotes.filter(d => d.id !== id);
      const log = createAuditEntry(
        currentUser,
        'DELETE_DEBIT_NOTE',
        'Debit Notes',
        `Deleted Debit Note ${dn.noteNumber} for ₹${dn.totalAmount.toLocaleString('en-IN')}`
      );
      return {
        ...prev,
        debitNotes: updatedNotes,
        suppliers: updatedSuppliers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Debit note deleted.');
  };

  // Quotation Management
  const getNextQuotationNumber = (): string => {
    const fy = getFinancialYear();
    const count = (state.quotations || []).length + 1;
    const padNum = count.toString().padStart(4, '0');
    return `${state.settings.quotationPrefix || 'QT'}/${fy}/${padNum}`;
  };

  const saveQuotation = (quotation: Quotation) => {
    setState(prev => {
      const isExisting = (prev.quotations || []).some(q => q.id === quotation.id);
      const updatedQuotations = isExisting
        ? prev.quotations.map(q => (q.id === quotation.id ? quotation : q))
        : [quotation, ...(prev.quotations || [])];

      const log = createAuditEntry(
        currentUser,
        isExisting ? 'EDIT_QUOTATION' : 'CREATE_QUOTATION',
        'Quotations',
        `${isExisting ? 'Updated' : 'Created'} Quotation ${quotation.quotationNumber} for ${quotation.customerName} - Total: ₹${quotation.totalAmount.toLocaleString('en-IN')}`
      );

      return {
        ...prev,
        quotations: updatedQuotations,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast(`Quotation ${quotation.quotationNumber} saved successfully.`);
  };

  const deleteQuotation = (id: string) => {
    setState(prev => {
      const q = (prev.quotations || []).find(item => item.id === id);
      const updatedQuotations = (prev.quotations || []).filter(item => item.id !== id);
      const log = createAuditEntry(
        currentUser,
        'DELETE_QUOTATION',
        'Quotations',
        `Deleted Quotation ${q?.quotationNumber || id}`
      );
      return {
        ...prev,
        quotations: updatedQuotations,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('Quotation deleted successfully.');
  };

  const convertQuotationToInvoice = (quotationId: string): Invoice => {
    const quote = (state.quotations || []).find(q => q.id === quotationId);
    if (!quote) throw new Error('Quotation not found');

    const invNum = getNextInvoiceNumber();
    const today = new Date().toISOString().substring(0, 10);
    const due = new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10);

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: invNum,
      invoiceDate: today,
      dueDate: due,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerGstin: quote.customerGstin,
      customerAddress: quote.customerAddress,
      customerState: quote.customerState,
      customerStateCode: quote.customerStateCode,
      placeOfSupply: quote.placeOfSupply,
      placeOfSupplyCode: quote.placeOfSupplyCode,
      isInterstate: quote.isInterstate,
      reverseCharge: false,
      items: quote.items,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      taxableAmount: quote.taxableAmount,
      cgstTotal: quote.cgstTotal,
      sgstTotal: quote.sgstTotal,
      igstTotal: quote.igstTotal,
      cessTotal: quote.cessTotal,
      roundOff: quote.roundOff,
      totalAmount: quote.totalAmount,
      amountPaid: 0,
      balanceDue: quote.totalAmount,
      paymentStatus: 'Unpaid',
      notes: `Converted from Quotation ${quote.quotationNumber}. ${quote.notes || ''}`.trim(),
      termsAndConditions: quote.termsAndConditions || state.settings.defaultPaymentTerms,
      createdAt: today,
    };

    saveInvoice(newInvoice);

    // Update quotation status to Converted
    setState(prev => {
      const updatedQuotations = (prev.quotations || []).map(q =>
        q.id === quotationId
          ? {
              ...q,
              status: 'Converted' as const,
              convertedInvoiceId: newInvoice.id,
              convertedInvoiceNumber: newInvoice.invoiceNumber,
            }
          : q
      );
      const log = createAuditEntry(
        currentUser,
        'CONVERT_QUOTATION',
        'Quotations',
        `Converted Quotation ${quote.quotationNumber} to Tax Invoice ${newInvoice.invoiceNumber}`
      );
      return {
        ...prev,
        quotations: updatedQuotations,
        auditLogs: [log, ...prev.auditLogs],
      };
    });

    showToast(`Quotation converted to Tax Invoice ${newInvoice.invoiceNumber}!`);
    return newInvoice;
  };

  const saveRecurring = (rec: RecurringInvoice) => {
    setState(prev => {
      const isExisting = prev.recurring.some(r => r.id === rec.id);
      const updated = isExisting ? prev.recurring.map(r => (r.id === rec.id ? rec : r)) : [...prev.recurring, rec];
      return {
        ...prev,
        recurring: updated,
      };
    });
    showToast('Recurring billing template saved.');
  };

  const deleteRecurring = (id: string) => {
    setState(prev => ({
      ...prev,
      recurring: prev.recurring.filter(r => r.id !== id),
    }));
    showToast('Recurring schedule deleted.');
  };

  const generateRecurringInvoices = (): number => {
    let generatedCount = 0;
    state.recurring.forEach(rec => {
      if (!rec.active) return;
      const cust = state.customers.find(c => c.id === rec.customerId);
      if (!cust) return;

      const fy = getFinancialYear();
      const invNum = `${state.settings.invoicePrefix}/${fy}/${(state.invoices.length + generatedCount + 1).toString().padStart(4, '0')}`;
      const isInterstate = cust.stateCode !== state.settings.stateCode;

      // Recalculate taxes for items
      const recalculatedItems = rec.items.map(item => {
        const gst = calculateGST(item.taxableAmount, item.gstRate, isInterstate, item.cessRate);
        return {
          ...item,
          cgstAmount: gst.cgstAmount,
          sgstAmount: gst.sgstAmount,
          igstAmount: gst.igstAmount,
          totalAmount: gst.totalAmount,
        };
      });

      const taxable = recalculatedItems.reduce((acc, it) => acc + it.taxableAmount, 0);
      const cgst = recalculatedItems.reduce((acc, it) => acc + it.cgstAmount, 0);
      const sgst = recalculatedItems.reduce((acc, it) => acc + it.sgstAmount, 0);
      const igst = recalculatedItems.reduce((acc, it) => acc + it.igstAmount, 0);
      const total = recalculatedItems.reduce((acc, it) => acc + it.totalAmount, 0);

      const today = new Date().toISOString().substring(0, 10);
      const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10);

      const newInv: Invoice = {
        id: `INV-${Date.now()}-${generatedCount}`,
        invoiceNumber: invNum,
        invoiceDate: today,
        dueDate,
        customerId: cust.id,
        customerName: cust.companyName || cust.name,
        customerGstin: cust.gstin,
        customerAddress: cust.billingAddress,
        customerState: cust.state,
        customerStateCode: cust.stateCode,
        placeOfSupply: cust.state,
        placeOfSupplyCode: cust.stateCode,
        isInterstate,
        reverseCharge: false,
        items: recalculatedItems,
        subtotal: taxable,
        discountTotal: 0,
        taxableAmount: taxable,
        cgstTotal: cgst,
        sgstTotal: sgst,
        igstTotal: igst,
        cessTotal: 0,
        roundOff: 0,
        totalAmount: total,
        amountPaid: 0,
        balanceDue: total,
        paymentStatus: 'Unpaid',
        notes: rec.notes || 'Auto-generated from recurring template.',
        termsAndConditions: rec.termsAndConditions || state.settings.defaultPaymentTerms,
        recurringId: rec.id,
        createdAt: today,
      };

      saveInvoice(newInv);
      generatedCount++;
    });

    if (generatedCount > 0) {
      showToast(`Generated ${generatedCount} invoice(s) from recurring schedules.`);
    } else {
      showToast('No active recurring schedules to run.', 'info');
    }
    return generatedCount;
  };

  const saveUser = (user: User) => {
    if (user.role === 'Super Admin' && !user.name.toLowerCase().includes('rooban')) {
      showToast('Policy restriction: Only Rooban is authorized as Super Admin.', 'error');
      return;
    }

    setState(prev => {
      const isExisting = prev.users.some(u => u.id === user.id);
      const updatedUsers = isExisting
        ? prev.users.map(u => (u.id === user.id ? user : u))
        : [...prev.users, user];
      const log = createAuditEntry(currentUser, 'EDIT_USER', 'Users', `Updated user: ${user.name} (${user.role})`);
      return {
        ...prev,
        users: updatedUsers,
        auditLogs: [log, ...prev.auditLogs],
      };
    });
    showToast('User credentials updated successfully.');
  };

  const backupData = (): string => {
    const backupJson = JSON.stringify(state, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MrFarmerCorp_Backup_${state.settings.financialYear}_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Database backup downloaded successfully.');
    return backupJson;
  };

  const restoreData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr) as AppState;
      if (!parsed.settings || !Array.isArray(parsed.invoices)) {
        throw new Error('Invalid backup schema');
      }
      setState(parsed);
      saveAllState(parsed);
      showToast('Database restored successfully from backup.');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Failed to restore database: Invalid backup file.', 'error');
      return false;
    }
  };

  const resetToDemo = () => {
    const fresh = resetDemoState();
    setState(fresh);
    showToast('Application reset to official demo state.');
  };

  return (
    <AppContext.Provider
      value={{
        state,
        currentUser,
        toasts,
        showToast,
        removeToast,
        setCurrentUserId,
        updateSettings,
        saveInvoice,
        deleteInvoice,
        cancelInvoice,
        saveQuotation,
        deleteQuotation,
        convertQuotationToInvoice,
        getNextQuotationNumber,
        savePurchase,
        deletePurchase,
        cancelPurchase,
        saveIncome,
        deleteIncome,
        saveExpense,
        deleteExpense,
        recordPayment,
        savePayment,
        deletePayment,
        saveAccount,
        recordTransfer,
        saveCustomer,
        deleteCustomer,
        saveSupplier,
        deleteSupplier,
        saveProduct,
        deleteProduct,
        saveCreditNote,
        deleteCreditNote,
        saveDebitNote,
        deleteDebitNote,
        saveRecurring,
        deleteRecurring,
        generateRecurringInvoices,
        saveUser,
        backupData,
        restoreData,
        resetToDemo,
        isLoggedIn,
        login,
        logout,
        credentialsModalOpen,
        setCredentialsModalOpen,
        getNextInvoiceNumber,
        getNextPurchaseNumber,
        getNextPaymentNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
