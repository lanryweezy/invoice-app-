export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxCategory?: 'Standard' | 'ZeroRated' | 'Exempt';
}

export interface Client {
  id?: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  tin?: string;
  cacNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  name: string;
  email: string;
  phoneNumber?: string;
  address: string;
  tin?: string;
  cacNumber?: string;
  bankName: string;
  accountNumber: string;
  logo?: string;
  paymentLink?: string;
}

export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';
export type RecurringFrequency = 'none' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

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
  discountRate: number;
  discountType: 'percentage' | 'fixed';
  shippingAmount: number;
  currency: Currency;
  status: InvoiceStatus;
  subtotal?: number;
  discountAmount?: number;
  tax?: number;
  whtAmount?: number;
  shipping?: number;
  total?: number;
  recurringFrequency?: RecurringFrequency;
  recurringIsActive?: boolean;
  nextDueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppConfig {
  userId?: string;
  email?: string;
  idToken?: string;
  refreshToken?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  bankName?: string;
  bankAccount?: string;
  bankSortCode?: string;
  defaultCurrency?: Currency;
  defaultVatRate?: number;
  branding?: {
    defaultLogo?: string;
    logoPosition?: string;
    primaryColor?: string;
    invoiceTitle?: string;
    footerText?: string;
  };
  smtp?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
  };
}

export interface Logo {
  id: string;
  name: string;
  url: string;
  isDefault: boolean;
  uploadedAt: string;
  width?: number;
  height?: number;
}

export interface RecurringInvoice {
  id?: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  items: string;
  interval: RecurringFrequency;
  dayOfMonth?: number;
  startDate: string;
  isActive: boolean;
  lastGenerated?: string;
  nextDueDate?: string;
  createdAt?: string;
}
