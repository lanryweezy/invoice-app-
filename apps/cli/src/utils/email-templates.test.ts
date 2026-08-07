import { describe, it, expect } from 'vitest';
import { generateEmailContent } from './email-templates';
import { Invoice, Client, User } from '../types';

describe('generateEmailContent', () => {
  const mockInvoice = {
    invoiceNumber: 'INV-2023-01-0001',
    dueDate: '2023-02-01',
    currency: 'NGN',
    total: 150000,
    client: { name: 'Acme Corp' } as Client,
    user: {} as User,
    lineItems: [
      { id: '1', description: 'Consulting', price: 150000, quantity: 1 }
    ]
  } as Invoice;

  const mockConfigWithBank = {
    businessName: 'My Agency',
    bankName: 'Test Bank',
    bankAccount: '1234567890',
    bankSortCode: '123456'
  };

  const mockConfigWithoutBank = {
    businessName: 'My Agency'
  };

  it('generates casual email content', () => {
    const result = generateEmailContent(mockInvoice, 'casual', mockConfigWithBank);
    expect(result.subject).toBe('Invoice INV-2023-01-0001');
    expect(result.body).toContain("Hi Acme Corp! Here's your invoice INV-2023-01-0001:");
    expect(result.body).toContain('Total: ₦150,000.00');
    expect(result.body).toContain('Test Bank');
  });

  it('generates formal email content (default fallback)', () => {
    const result = generateEmailContent(mockInvoice, 'unknown-template', mockConfigWithBank);
    expect(result.subject).toBe('Invoice INV-2023-01-0001');
    expect(result.body).toContain('Dear Acme Corp,');
    expect(result.body).toContain('Payment Details:\nBank: Test Bank');
  });

  it('generates formal email content directly', () => {
    const result = generateEmailContent(mockInvoice, 'formal', mockConfigWithoutBank);
    expect(result.subject).toBe('Invoice INV-2023-01-0001');
    expect(result.body).toContain('Dear Acme Corp,');
    expect(result.body).not.toContain('Test Bank');
  });

  it('generates followup email content', () => {
    const result = generateEmailContent(mockInvoice, 'followup', mockConfigWithBank);
    expect(result.subject).toBe('Invoice INV-2023-01-0001 - Payment Reminder');
    expect(result.body).toContain('This is a friendly reminder about invoice INV-2023-01-0001');
  });

  it('generates overdue email content', () => {
    const result = generateEmailContent(mockInvoice, 'overdue', mockConfigWithBank);
    expect(result.subject).toBe('URGENT: Invoice INV-2023-01-0001');
    expect(result.body).toContain('URGENT: Invoice INV-2023-01-0001 for ₦150,000.00 is now past due.');
  });
});
