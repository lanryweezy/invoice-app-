
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

export interface User {
  name: string;
  email: string;
  phoneNumber?: string;
  address: string;
  bankName: string;
  accountNumber: string;
  logo?: string; // Base64 string for the image
}

export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue';

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
  discountRate: number | string; // Changed to allow string input for decimals
  shippingAmount: number | string; // Added shipping amount
  currency: Currency;
  status: InvoiceStatus;
  subtotal?: number;
  discountAmount?: number;
  tax?: number;
  shipping?: number;
  total?: number;
}

export type TemplateId = 'classic' | 'modern' | 'bold' | 'minimalist' | 'professional' | 'elegant' | 'tech';