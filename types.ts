
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number | '';
}

export interface Client {
  name: string;
  email: string;
  address: string;
}

export type PaymentGateway = 'Paystack' | 'Flutterwave' | 'Monnify' | 'Kora' | 'Squad' | 'Interswitch' | 'OPay' | 'Fincra';

export interface User {
  name: string;
  email: string;
  phoneNumber?: string;
  address: string;
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

export type RecurringFrequency = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface Receipt {
  id: string; // e.g., RCP-2026-xxx
  invoiceNumber: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string;
  amountPaid: number;
  invoice: Invoice; // snapshot of the invoice
}

export interface Invoice {
  user: User;
  client: Client;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  terms: string;
  taxRate: number;
  whtRate: number; // Withholding Tax percentage (e.g. 5 or 10)
  discountRate: number | string; // Percentage
  discountType: 'percentage' | 'fixed';
  shippingAmount: number | string; // Added shipping amount
  currency: Currency;
  status: InvoiceStatus;
  subtotal?: number;
  discountAmount?: number;
  tax?: number;
  whtAmount?: number;
  shipping?: number;
  total?: number;
  recurringFrequency?: RecurringFrequency;
}

export type TemplateId = 'classic' | 'modern' | 'bold' | 'minimalist' | 'professional' | 'elegant' | 'tech';