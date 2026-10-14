export type UserRole = 'Super Admin' | 'Accountant' | 'Staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  username?: string;
  password?: string;
  active: boolean;
  lastLogin?: string;
}

export interface BusinessSettings {
  businessName: string;
  tradeName?: string;
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  upiId: string;
  logoUrl?: string;
  financialYear: string; // e.g. "2026-27"
  invoicePrefix: string;
  invoiceStartingNumber: number;
  quotationPrefix: string;
  quotationStartingNumber: number;
  purchasePrefix: string;
  purchaseStartingNumber: number;
  paymentPrefix: string;
  creditNotePrefix: string;
  debitNotePrefix: string;
  expensePrefix: string;
  incomePrefix: string;
  defaultPaymentTerms: string;
  defaultNotes: string;
  defaultGstRate: number;
  enableCess: boolean;
}

export type CustomerType = 'Regular' | 'Composition' | 'Consumer' | 'Unregistered' | 'SEZ';

export interface Customer {
  id: string;
  customerId: string; // e.g. CUST-001
  name: string;
  companyName: string;
  mobile: string;
  email: string;
  billingAddress: string;
  shippingAddress?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  pan: string;
  customerType: CustomerType;
  creditLimit: number;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  supplierId: string; // e.g. SUP-001
  name: string;
  companyName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  pan: string;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
}

export type ItemType = 'Product' | 'Service' | 'Non-stock';
export type UnitType = 'PCS' | 'NOS' | 'KG' | 'MTR' | 'BOX' | 'SET' | 'HOURS' | 'PKT' | 'LTR';

export interface Product {
  id: string;
  productId: string; // e.g. PRD-001
  name: string;
  sku: string;
  hsnSac: string;
  category: string;
  unit: UnitType;
  type: ItemType;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // 0, 5, 12, 18, 28
  openingStock: number;
  currentStock: number;
  minStockLevel: number;
  description?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  hsnSac: string;
  quantity: number;
  unit: UnitType;
  rate: number;
  discount: number; // percent or flat value
  discountType: 'percentage' | 'flat';
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  totalAmount: number;
}

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV/2026-27/0001
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  customerAddress: string;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  isInterstate: boolean;
  reverseCharge: boolean;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  roundOff: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  attachmentName?: string;
  attachmentData?: string; // Data URL for uploaded PDF or image
  isImported?: boolean;
  notes: string;
  termsAndConditions: string;
  recurringId?: string;
  createdAt: string;
  cancelledReason?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  hsnSac: string;
  quantity: number;
  unit: UnitType;
  purchaseRate: number;
  discount: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessRate: number;
  cessAmount: number;
  totalAmount: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string; // e.g. PUR/2026-27/0001 or vendor bill no
  vendorBillNumber?: string;
  purchaseDate: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  supplierState: string;
  supplierStateCode: string;
  isInterstate: boolean;
  items: PurchaseItem[];
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  roundOff: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  attachmentName?: string;
  attachmentData?: string; // Data URL / Base64
  notes?: string;
  createdAt: string;
  cancelledReason?: string;
}

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque' | 'Other';

export interface Income {
  id: string;
  incomeNumber: string; // INC-0001
  date: string;
  category: string;
  description: string;
  source: string;
  amount: number;
  gstApplicable: boolean;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  referenceNumber?: string;
  attachmentName?: string;
  attachmentData?: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string; // EXP-0001
  date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  gstApplicable: boolean;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  referenceNumber?: string;
  attachmentName?: string;
  attachmentData?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  paymentNumber: string; // PAY-0001 or REC-0001
  type: 'Customer Payment' | 'Supplier Payment';
  entityId: string; // customerId or supplierId
  entityName: string;
  invoiceOrBillId?: string;
  invoiceOrBillNumber?: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'UPI';
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  openingBalance: number;
  currentBalance: number;
  isDefault?: boolean;
}

export interface AccountTransfer {
  id: string;
  transferNumber: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  noteNumber: string; // CN/2026-27/0001
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  reason: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface DebitNote {
  id: string;
  noteNumber: string; // DN/2026-27/0001
  originalBillId: string;
  originalBillNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  reason: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export type RecurringFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface RecurringInvoice {
  id: string;
  title: string;
  customerId: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDate: string;
  lastGeneratedDate?: string;
  items: InvoiceItem[];
  notes?: string;
  termsAndConditions?: string;
  active: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Converted';

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. QT/2026-27/0001
  quotationDate: string; // YYYY-MM-DD
  validUntil: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  customerAddress: string;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  isInterstate: boolean;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  roundOff: number;
  totalAmount: number;
  status: QuotationStatus;
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  notes: string;
  termsAndConditions: string;
  createdAt: string;
}
