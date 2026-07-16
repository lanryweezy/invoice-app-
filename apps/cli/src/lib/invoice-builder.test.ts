import { describe, it, expect } from 'vitest';
import { createInvoice, CreateInvoiceData } from './invoice-builder';
import { LineItem, User, Client } from '../types';

const mockUser: User = {
  name: 'Test Business',
  email: 'test@business.com',
  address: '123 Business St',
  bankName: 'Test Bank',
  accountNumber: '1234567890',
};

const mockClient: Client = {
  name: 'Test Client',
  email: 'client@test.com',
  address: '456 Client Ave',
};

const mockLineItems: LineItem[] = [
  { id: '1', description: 'Design', quantity: 1, price: 100000 },
  { id: '2', description: 'Development', quantity: 1, price: 200000 },
];

function baseData(overrides: Partial<CreateInvoiceData> = {}): CreateInvoiceData {
  return {
    user: mockUser,
    client: mockClient,
    lineItems: mockLineItems,
    issueDate: '2026-07-15',
    dueDate: '2026-08-15',
    ...overrides,
  };
}

describe('createInvoice', () => {
  it('returns invoice with auto-generated invoice number matching INV-YYYY-MM-NNNN', () => {
    const invoice = createInvoice(baseData());
    const pattern = /^INV-\d{4}-\d{2}-\d{4}$/;
    expect(invoice.invoiceNumber).toMatch(pattern);
  });

  it('calculates subtotal from line items', () => {
    const invoice = createInvoice(baseData());
    expect(invoice.subtotal).toBe(300000);
  });

  it('applies VAT rate correctly', () => {
    const invoice = createInvoice(baseData({ taxRate: 7.5 }));
    // VAT on 300000 at 7.5% = 22500
    expect(invoice.tax).toBe(22500);
  });

  it('applies WHT rate correctly', () => {
    const invoice = createInvoice(baseData({ whtRate: 5 }));
    // WHT on 300000 at 5% = 15000
    expect(invoice.whtAmount).toBe(15000);
  });

  it('calculates percentage discount', () => {
    const invoice = createInvoice(baseData({ discountRate: 10, discountType: 'percentage' }));
    expect(invoice.discountAmount).toBe(30000); // 10% of 300000
    expect(invoice.subtotal).toBe(300000);
  });

  it('calculates fixed discount', () => {
    const invoice = createInvoice(baseData({ discountRate: 50000, discountType: 'fixed' }));
    expect(invoice.discountAmount).toBe(50000);
  });

  it('sets status to Draft by default', () => {
    const invoice = createInvoice(baseData());
    expect(invoice.status).toBe('Draft');
  });

  it('includes timestamps', () => {
    const invoice = createInvoice(baseData());
    expect(invoice.createdAt).toBeDefined();
    expect(invoice.updatedAt).toBeDefined();
    expect(new Date(invoice.createdAt!).getTime()).not.toBeNaN();
    expect(new Date(invoice.updatedAt!).getTime()).not.toBeNaN();
  });

  it('handles empty line items gracefully', () => {
    const invoice = createInvoice(baseData({ lineItems: [] }));
    expect(invoice.subtotal).toBe(0);
    expect(invoice.tax).toBe(0);
    expect(invoice.whtAmount).toBe(0);
    expect(invoice.total).toBe(0);
  });

  it('computes total correctly', () => {
    const invoice = createInvoice(baseData());
    // total = taxableAmount + vat - wht + stampDuty + shipping
    // taxableAmount = 300000, vat = 22500, wht = 15000, stampDuty = 100, shipping = 0
    expect(invoice.total).toBe(307600);
  });
});
