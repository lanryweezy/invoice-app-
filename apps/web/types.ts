
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number | '';
  taxCategory?: 'Standard' | 'ZeroRated' | 'Exempt';
  unitOfMeasure?: string; // e.g., 'PCS', 'HRS', 'KG'
}

export interface Client {
  name: string;
  email: string;
  address: string;
  tin?: string; // Tax Identification Number
  cacNumber?: string; // Corporate Affairs Commission Number
}

export type PaymentGateway = 'Paystack' | 'Flutterwave' | 'Remita' | 'Monnify' | 'Kora' | 'Squad' | 'Interswitch' | 'OPay' | 'Fincra';

export interface User {
  name: string;
  email: string;
  phoneNumber?: string;
  address: string;
  tin?: string; // Tax Identification Number
  cacNumber?: string; // Corporate Affairs Commission Number
  bankName: string;
  accountNumber: string;
  logo?: string; // Base64 string for the image
  paymentLink?: string; // E.g. Paystack payment link
  paymentGateway?: PaymentGateway;
}

export interface BusinessProfile extends User {
  id: string;
}

export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

export type DocumentType = 'Tax Invoice' | 'Pro-forma' | 'Receipt' | 'Quote';

export type NRSComplianceStatus = 'None' | 'Pending' | 'Verified' | 'Failed';

export type RecurringFrequency = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | (string & {});

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  vendor?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
}

export interface Receipt {
  id: string; // e.g., RCP-2026-001
  invoiceNumber: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  amountPaid: number;
  invoice: Invoice; // snapshot of the invoice
}

export interface Invoice {
  id?: string;
  user: User;
  client: Client;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  terms: string;
  taxRate: number;
  whtRate: number;
  discountRate: number | string;
  discountType: 'percentage' | 'fixed';
  shippingAmount: number | string;
  currency: Currency;
  status: InvoiceStatus;
  documentType?: DocumentType;
  nrsStatus?: NRSComplianceStatus;
  nrsValidationMessage?: string;
  digitalSignature?: string;
  subtotal?: number;
  discountAmount?: number;
  tax?: number;
  whtAmount?: number;
  shipping?: number;
  total?: number;
  recurringFrequency?: RecurringFrequency;
  recurringIsActive?: boolean;
  nextDueDate?: string;
  lastGenerated?: string;
  portalToken?: string;
  portalViewed?: boolean;
  portalViewedAt?: string;
  paymentConfirmedByClient?: boolean;
  paymentConfirmedAt?: string;
  convertedFromProforma?: boolean;
  proformaId?: string;
}

export type TemplateId = 'classic' | 'modern' | 'bold' | 'minimalist' | 'professional' | 'elegant' | 'tech' | (string & {});

export interface ClientPortalLink {
  token: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  currency: Currency;
  status: InvoiceStatus;
  createdAt: string;
  expiresAt?: string;
}