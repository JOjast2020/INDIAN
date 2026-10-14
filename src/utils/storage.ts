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
  PaymentRecord,
  Product,
  PurchaseBill,
  Quotation,
  RecurringInvoice,
  Supplier,
  User,
  UserRole,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CREDIT_NOTES,
  INITIAL_CUSTOMERS,
  INITIAL_DEBIT_NOTES,
  INITIAL_EXPENSES,
  INITIAL_INCOME,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASES,
  INITIAL_QUOTATIONS,
  INITIAL_RECURRING,
  INITIAL_SETTINGS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
} from './mockData';

const STORAGE_KEYS = {
  SETTINGS: 'bv_settings_v1',
  USERS: 'bv_users_v1',
  CURRENT_USER_ID: 'bv_current_user_id_v1',
  IS_LOGGED_IN: 'mrfarmer_is_logged_in_v1',
  CUSTOMERS: 'bv_customers_v1',
  SUPPLIERS: 'bv_suppliers_v1',
  PRODUCTS: 'bv_products_v1',
  INVOICES: 'bv_invoices_v1',
  QUOTATIONS: 'bv_quotations_v1',
  PURCHASES: 'bv_purchases_v1',
  EXPENSES: 'bv_expenses_v1',
  INCOME: 'bv_income_v1',
  PAYMENTS: 'bv_payments_v1',
  ACCOUNTS: 'bv_accounts_v1',
  TRANSFERS: 'bv_transfers_v1',
  CREDIT_NOTES: 'bv_credit_notes_v1',
  DEBIT_NOTES: 'bv_debit_notes_v1',
  RECURRING: 'bv_recurring_v1',
  AUDIT_LOGS: 'bv_audit_logs_v1',
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading key', key, err);
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed writing key', key, err);
  }
}

export interface AppState {
  settings: BusinessSettings;
  users: User[];
  currentUserId: string;
  customers: Customer[];
  suppliers: Supplier[];
  products: Product[];
  invoices: Invoice[];
  quotations: Quotation[];
  purchases: PurchaseBill[];
  expenses: Expense[];
  income: Income[];
  payments: PaymentRecord[];
  accounts: Account[];
  transfers: AccountTransfer[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  recurring: RecurringInvoice[];
  auditLogs: AuditLog[];
}

export function loadAppState(): AppState {
  let loadedSettings = getLocal<BusinessSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  if (
    !loadedSettings ||
    loadedSettings.gstin !== '33AWTPN9040Q1ZM' ||
    loadedSettings.pan !== 'AWTPN9040Q' ||
    loadedSettings.phone !== '6380323254' ||
    !loadedSettings.businessName.includes('Farmer')
  ) {
    loadedSettings = {
      ...INITIAL_SETTINGS,
      ...(loadedSettings || {}),
      businessName: 'Mr. Farmer Corp.',
      tradeName: 'Mr,farmercorp',
      phone: '6380323254',
      pan: 'AWTPN9040Q',
      gstin: '33AWTPN9040Q1ZM',
      email: 'admin@mr.farmercorp.in',
    };
    setLocal(STORAGE_KEYS.SETTINGS, loadedSettings);
  }

  let loadedUsers = getLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  const roobanExists = loadedUsers.some(
    u => u.name.toLowerCase().includes('rooban') && u.role === 'Super Admin'
  );
  const hasMultipleAdmins = loadedUsers.filter(u => u.role === 'Super Admin').length > 1;
  const hasOldBharatUsers = loadedUsers.some(
    u => (u.email && u.email.includes('bharattech')) || (u.role === 'Super Admin' && !u.name.toLowerCase().includes('rooban'))
  );

  if (!roobanExists || hasMultipleAdmins || hasOldBharatUsers) {
    loadedUsers = INITIAL_USERS;
    setLocal(STORAGE_KEYS.USERS, loadedUsers);
    setLocal(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
  }

  let loadedAccounts = getLocal<Account[]>(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  if (loadedAccounts?.some(a => a.name.includes('bharattech'))) {
    loadedAccounts = INITIAL_ACCOUNTS;
    setLocal(STORAGE_KEYS.ACCOUNTS, loadedAccounts);
  }

  return {
    settings: loadedSettings,
    users: loadedUsers,
    currentUserId: loadedUsers[0].id,
    customers: getLocal(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
    suppliers: getLocal(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS),
    products: getLocal(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
    invoices: getLocal(STORAGE_KEYS.INVOICES, INITIAL_INVOICES),
    quotations: getLocal(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS),
    purchases: getLocal(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES),
    expenses: getLocal(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
    income: getLocal(STORAGE_KEYS.INCOME, INITIAL_INCOME),
    payments: getLocal(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),
    accounts: loadedAccounts,
    transfers: getLocal(STORAGE_KEYS.TRANSFERS, [] as AccountTransfer[]),
    creditNotes: getLocal(STORAGE_KEYS.CREDIT_NOTES, INITIAL_CREDIT_NOTES),
    debitNotes: getLocal(STORAGE_KEYS.DEBIT_NOTES, INITIAL_DEBIT_NOTES),
    recurring: getLocal(STORAGE_KEYS.RECURRING, INITIAL_RECURRING),
    auditLogs: getLocal(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  };
}

export function saveAllState(state: AppState): void {
  setLocal(STORAGE_KEYS.SETTINGS, state.settings);
  setLocal(STORAGE_KEYS.USERS, state.users);
  setLocal(STORAGE_KEYS.CURRENT_USER_ID, state.currentUserId);
  setLocal(STORAGE_KEYS.CUSTOMERS, state.customers);
  setLocal(STORAGE_KEYS.SUPPLIERS, state.suppliers);
  setLocal(STORAGE_KEYS.PRODUCTS, state.products);
  setLocal(STORAGE_KEYS.INVOICES, state.invoices);
  setLocal(STORAGE_KEYS.QUOTATIONS, state.quotations);
  setLocal(STORAGE_KEYS.PURCHASES, state.purchases);
  setLocal(STORAGE_KEYS.EXPENSES, state.expenses);
  setLocal(STORAGE_KEYS.INCOME, state.income);
  setLocal(STORAGE_KEYS.PAYMENTS, state.payments);
  setLocal(STORAGE_KEYS.ACCOUNTS, state.accounts);
  setLocal(STORAGE_KEYS.TRANSFERS, state.transfers);
  setLocal(STORAGE_KEYS.CREDIT_NOTES, state.creditNotes);
  setLocal(STORAGE_KEYS.DEBIT_NOTES, state.debitNotes);
  setLocal(STORAGE_KEYS.RECURRING, state.recurring);
  setLocal(STORAGE_KEYS.AUDIT_LOGS, state.auditLogs);
}

export function resetDemoState(): AppState {
  const state: AppState = {
    settings: INITIAL_SETTINGS,
    users: INITIAL_USERS,
    currentUserId: INITIAL_USERS[0].id,
    customers: INITIAL_CUSTOMERS,
    suppliers: INITIAL_SUPPLIERS,
    products: INITIAL_PRODUCTS,
    invoices: INITIAL_INVOICES,
    quotations: INITIAL_QUOTATIONS,
    purchases: INITIAL_PURCHASES,
    expenses: INITIAL_EXPENSES,
    income: INITIAL_INCOME,
    payments: INITIAL_PAYMENTS,
    accounts: INITIAL_ACCOUNTS,
    transfers: [],
    creditNotes: INITIAL_CREDIT_NOTES,
    debitNotes: INITIAL_DEBIT_NOTES,
    recurring: INITIAL_RECURRING,
    auditLogs: [
      {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: 'USR-ROOBAN-1',
        userName: 'Rooban',
        userRole: 'Super Admin',
        action: 'RESET_DATABASE',
        module: 'System',
        details: 'System restored to official state for mr.farmercorp with GST compliance.',
      },
      ...INITIAL_AUDIT_LOGS,
    ],
  };
  saveAllState(state);
  return state;
}

export function createAuditEntry(
  currentUser: User,
  action: string,
  module: string,
  details: string
): AuditLog {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: ts,
    userId: currentUser.id,
    userName: currentUser.name,
    userRole: currentUser.role,
    action,
    module,
    details,
  };
}

export function getStoredLoginStatus(): boolean {
  return getLocal<boolean>(STORAGE_KEYS.IS_LOGGED_IN, true);
}

export function setStoredLoginStatus(status: boolean): void {
  setLocal(STORAGE_KEYS.IS_LOGGED_IN, status);
}
