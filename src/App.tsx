/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuditLogView } from './components/audit/AuditLogView';
import { CashBankList } from './components/cashbank/CashBankList';
import { TransferModal } from './components/cashbank/TransferModal';
import { Header } from './components/common/Header';
import { NavTab, Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { CreditDebitNotes } from './components/creditdebit/CreditDebitNotes';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerModal } from './components/customers/CustomerModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { ExpenseList } from './components/expenses/ExpenseList';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { GSTReports } from './components/gst/GSTReports';
import { IncomeList } from './components/income/IncomeList';
import { IncomeModal } from './components/income/IncomeModal';
import { InvoiceFormModal } from './components/invoices/InvoiceFormModal';
import { InvoiceList } from './components/invoices/InvoiceList';
import { InvoicePrintModal } from './components/invoices/InvoicePrintModal';
import { QuotationList } from './components/quotations/QuotationList';
import { PaymentList } from './components/payments/PaymentList';
import { PaymentModal } from './components/payments/PaymentModal';
import { ProductList } from './components/products/ProductList';
import { ProductModal } from './components/products/ProductModal';
import { PurchaseFormModal } from './components/purchases/PurchaseFormModal';
import { PurchaseList } from './components/purchases/PurchaseList';
import { RecurringInvoices } from './components/recurring/RecurringInvoices';
import { ProfitAndLoss } from './components/reports/ProfitAndLoss';
import { ReportsCenter } from './components/reports/ReportsCenter';
import { SettingsView } from './components/settings/SettingsView';
import { SupplierList } from './components/suppliers/SupplierList';
import { SupplierModal } from './components/suppliers/SupplierModal';
import { UserManagement } from './components/users/UserManagement';
import { LoginPage } from './components/auth/LoginPage';
import { CredentialsModal } from './components/auth/CredentialsModal';
import { AppProvider, useApp } from './context/AppContext';
import {
  Customer,
  Expense,
  Income,
  Invoice,
  PaymentRecord,
  Product,
  PurchaseBill,
  Supplier,
} from './types';

const MainLayout: React.FC = () => {
  const { currentUser, isLoggedIn } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Invoices Modals
  const [invoiceModalOpen, setInvoiceModalOpen] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);

  // Purchases Modals
  const [purchaseModalOpen, setPurchaseModalOpen] = useState<boolean>(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseBill | null>(null);

  // Customers Modals
  const [customerModalOpen, setCustomerModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Suppliers Modals
  const [supplierModalOpen, setSupplierModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Products Modals
  const [productModalOpen, setProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Expenses Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Income Modals
  const [incomeModalOpen, setIncomeModalOpen] = useState<boolean>(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);

  // Payments Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentModalType, setPaymentModalType] = useState<
    'Customer Payment' | 'Supplier Payment'
  >('Customer Payment');
  const [paymentLinkedDocId, setPaymentLinkedDocId] = useState<string | undefined>(undefined);

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState<boolean>(false);

  // Handlers for quick triggers
  const handleQuickNewInvoice = () => {
    setEditingInvoice(null);
    setInvoiceModalOpen(true);
  };

  const handleQuickNewExpense = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const handleQuickNewPayment = () => {
    setPaymentModalType('Customer Payment');
    setPaymentLinkedDocId(undefined);
    setPaymentModalOpen(true);
  };

  // Restrict access for staff
  const isAccessible = (tab: NavTab): boolean => {
    if (currentUser.role === 'Staff') {
      return ['dashboard', 'invoices', 'customers', 'products', 'expenses'].includes(tab);
    }
    return true;
  };

  const safeTab = isAccessible(currentTab) ? currentTab : 'dashboard';

  if (!isLoggedIn) {
    return (
      <>
        <ToastContainer />
        <LoginPage />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Alert Container */}
      <ToastContainer />

      {/* Super Admin Credentials Modal */}
      <CredentialsModal />

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={safeTab}
        onSelectTab={t => setCurrentTab(t)}
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          currentTab={safeTab}
          onOpenMobile={() => setMobileMenuOpen(true)}
          onQuickNewInvoice={handleQuickNewInvoice}
          onQuickNewExpense={handleQuickNewExpense}
          onQuickNewPayment={handleQuickNewPayment}
        />

        {/* Content View Container */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {safeTab === 'dashboard' && (
            <Dashboard
              onOpenInvoiceModal={handleQuickNewInvoice}
              onOpenExpenseModal={handleQuickNewExpense}
              onViewInvoice={inv => {
                setPrintingInvoice(inv);
                setPrintModalOpen(true);
              }}
              onPrintInvoice={inv => {
                setPrintingInvoice(inv);
                setPrintModalOpen(true);
              }}
              onNavigateTab={t => setCurrentTab(t)}
            />
          )}

          {safeTab === 'invoices' && (
            <InvoiceList
              onOpenCreateModal={() => {
                setEditingInvoice(null);
                setInvoiceModalOpen(true);
              }}
              onEditInvoice={inv => {
                setEditingInvoice(inv);
                setInvoiceModalOpen(true);
              }}
              onViewInvoice={inv => {
                setPrintingInvoice(inv);
                setPrintModalOpen(true);
              }}
              onPrintInvoice={inv => {
                setPrintingInvoice(inv);
                setPrintModalOpen(true);
              }}
              onQuickPayment={inv => {
                setPaymentModalType('Customer Payment');
                setPaymentLinkedDocId(inv.id);
                setPaymentModalOpen(true);
              }}
            />
          )}

          {safeTab === 'quotations' && (
            <QuotationList
              onNavigateToInvoice={() => {
                setCurrentTab('invoices');
              }}
            />
          )}

          {safeTab === 'purchases' && (
            <PurchaseList
              onOpenCreateModal={() => {
                setEditingPurchase(null);
                setPurchaseModalOpen(true);
              }}
              onEditBill={bill => {
                setEditingPurchase(bill);
                setPurchaseModalOpen(true);
              }}
              onQuickPayment={bill => {
                setPaymentModalType('Supplier Payment');
                setPaymentLinkedDocId(bill.id);
                setPaymentModalOpen(true);
              }}
            />
          )}

          {safeTab === 'customers' && (
            <CustomerList
              onOpenCreateModal={() => {
                setEditingCustomer(null);
                setCustomerModalOpen(true);
              }}
              onEditCustomer={cust => {
                setEditingCustomer(cust);
                setCustomerModalOpen(true);
              }}
            />
          )}

          {safeTab === 'suppliers' && (
            <SupplierList
              onOpenCreateModal={() => {
                setEditingSupplier(null);
                setSupplierModalOpen(true);
              }}
              onEditSupplier={sup => {
                setEditingSupplier(sup);
                setSupplierModalOpen(true);
              }}
            />
          )}

          {safeTab === 'products' && (
            <ProductList
              onOpenCreateModal={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              onEditProduct={prod => {
                setEditingProduct(prod);
                setProductModalOpen(true);
              }}
            />
          )}

          {safeTab === 'income' && (
            <IncomeList
              onOpenCreateModal={() => {
                setEditingIncome(null);
                setIncomeModalOpen(true);
              }}
              onEditIncome={inc => {
                setEditingIncome(inc);
                setIncomeModalOpen(true);
              }}
            />
          )}

          {safeTab === 'expenses' && (
            <ExpenseList
              onOpenCreateModal={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onEditExpense={exp => {
                setEditingExpense(exp);
                setExpenseModalOpen(true);
              }}
            />
          )}

          {safeTab === 'payments' && (
            <PaymentList
              onOpenCreateModal={nature => {
                setPaymentModalType(nature || 'Customer Payment');
                setPaymentLinkedDocId(undefined);
                setPaymentModalOpen(true);
              }}
            />
          )}

          {safeTab === 'cashbank' && (
            <CashBankList
              onOpenTransferModal={() => setTransferModalOpen(true)}
            />
          )}

          {safeTab === 'creditdebit' && <CreditDebitNotes />}

          {safeTab === 'recurring' && <RecurringInvoices />}

          {safeTab === 'gstreports' && <GSTReports />}

          {safeTab === 'profitloss' && <ProfitAndLoss />}

          {safeTab === 'reports' && <ReportsCenter />}

          {safeTab === 'users' && <UserManagement />}

          {safeTab === 'audit' && <AuditLogView />}

          {safeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* --- Global Modals --- */}

      {/* Invoice Form Modal */}
      {invoiceModalOpen && (
        <InvoiceFormModal
          initialInvoice={editingInvoice}
          onClose={() => {
            setInvoiceModalOpen(false);
            setEditingInvoice(null);
          }}
        />
      )}

      {/* Invoice Printable View Modal */}
      {printModalOpen && (
        <InvoicePrintModal
          invoice={printingInvoice}
          onClose={() => {
            setPrintModalOpen(false);
            setPrintingInvoice(null);
          }}
        />
      )}

      {/* Purchase Form Modal */}
      {purchaseModalOpen && (
        <PurchaseFormModal
          initialBill={editingPurchase}
          onClose={() => {
            setPurchaseModalOpen(false);
            setEditingPurchase(null);
          }}
        />
      )}

      {/* Customer Modal */}
      {customerModalOpen && (
        <CustomerModal
          initialCustomer={editingCustomer}
          onClose={() => {
            setCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Supplier Modal */}
      {supplierModalOpen && (
        <SupplierModal
          initialSupplier={editingSupplier}
          onClose={() => {
            setSupplierModalOpen(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {/* Product Modal */}
      {productModalOpen && (
        <ProductModal
          initialProduct={editingProduct}
          onClose={() => {
            setProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Expense Modal */}
      {expenseModalOpen && (
        <ExpenseModal
          initialExpense={editingExpense}
          onClose={() => {
            setExpenseModalOpen(false);
            setEditingExpense(null);
          }}
        />
      )}

      {/* Income Modal */}
      {incomeModalOpen && (
        <IncomeModal
          initialIncome={editingIncome}
          onClose={() => {
            setIncomeModalOpen(false);
            setEditingIncome(null);
          }}
        />
      )}

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          initialType={paymentModalType}
          initialInvoiceOrBillId={paymentLinkedDocId}
          onClose={() => {
            setPaymentModalOpen(false);
            setPaymentLinkedDocId(undefined);
          }}
        />
      )}

      {/* Contra Transfer Modal */}
      {transferModalOpen && (
        <TransferModal onClose={() => setTransferModalOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
