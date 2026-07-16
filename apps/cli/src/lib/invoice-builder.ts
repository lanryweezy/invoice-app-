import { Invoice, LineItem, User, Client, Currency, InvoiceStatus, RecurringFrequency } from '../types';
import { getTaxBreakdown } from './tax-calculator';
import { generateInvoiceNumber } from '../utils/formatter';

export interface CreateInvoiceData {
  user: User;
  client: Client;
  lineItems: LineItem[];
  issueDate: string;
  dueDate: string;
  notes?: string;
  terms?: string;
  taxRate?: number;
  whtRate?: number;
  discountRate?: number;
  discountType?: 'percentage' | 'fixed';
  shippingAmount?: number;
  currency?: Currency;
  status?: InvoiceStatus;
  existingInvoices?: Invoice[];
  recurringFrequency?: RecurringFrequency;
  recurringIsActive?: boolean;
  nextDueDate?: string;
}

export function createInvoice(data: CreateInvoiceData): Invoice {
  const {
    user,
    client,
    lineItems,
    issueDate,
    dueDate,
    notes = '',
    terms = '',
    taxRate = 7.5,
    whtRate = 5,
    discountRate = 0,
    discountType = 'percentage',
    shippingAmount = 0,
    currency = 'NGN',
    status = 'Draft',
    existingInvoices = [],
    recurringFrequency,
    recurringIsActive,
    nextDueDate,
  } = data;

  const invoiceNumber = generateInvoiceNumber(existingInvoices);

  const breakdown = getTaxBreakdown(
    lineItems,
    taxRate,
    whtRate,
    discountRate,
    discountType,
    shippingAmount
  );

  const now = new Date().toISOString();

  const invoice: Invoice = {
    user,
    client,
    invoiceNumber,
    issueDate,
    dueDate,
    lineItems,
    notes,
    terms,
    taxRate,
    whtRate,
    discountRate,
    discountType,
    shippingAmount,
    currency,
    status,
    subtotal: breakdown.subtotal,
    discountAmount: breakdown.discountAmount,
    tax: breakdown.vatAmount,
    whtAmount: breakdown.whtAmount,
    shipping: breakdown.shipping,
    total: breakdown.total,
    createdAt: now,
    updatedAt: now,
  };

  if (recurringFrequency && recurringFrequency !== 'none') {
    invoice.recurringFrequency = recurringFrequency;
    invoice.recurringIsActive = recurringIsActive ?? true;
    invoice.nextDueDate = nextDueDate;
  }

  return invoice;
}
