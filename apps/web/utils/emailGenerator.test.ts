import { describe, it, expect } from 'vitest';
import { generateEmailTemplate, getEmailSubject, getEmailBody } from './emailGenerator';
import type { Invoice } from '../types';

describe('emailGenerator', () => {
  const mockInvoice = {
    invoiceNumber: 'INV-1234',
    issueDate: '2024-01-01',
    dueDate: '2024-01-15',
    currency: 'NGN',
    total: 150000,
    notes: 'Please pay promptly.',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
      bankName: 'GTBank',
      accountNumber: '0123456789'
    },
    client: {
      name: 'Acme Corp',
      email: 'billing@acmecorp.com',
      address: '456 Market St'
    },
    lineItems: [
      { description: 'Web Design', quantity: 1, price: '100000' },
      { description: 'Hosting', quantity: 1, price: '50000' }
    ]
  } as Invoice;

  describe('getEmailSubject', () => {
    it('generates formal subject', () => {
      const subject = getEmailSubject(mockInvoice, 'formal');
      expect(subject).toBe('Invoice INV-1234 from John Doe');
    });

    it('generates casual subject', () => {
      const subject = getEmailSubject(mockInvoice, 'casual');
      expect(subject).toBe("Hey Acme Corp \u2014 here's your invoice");
    });

    it('generates followup subject', () => {
      const subject = getEmailSubject(mockInvoice, 'followup');
      expect(subject).toContain('Gentle reminder: Invoice INV-1234');
      // Non-breaking spaces and currency symbols can be tricky, so let's match the number
      expect(subject).toContain('150,000');
    });

    it('generates overdue subject', () => {
      const subject = getEmailSubject(mockInvoice, 'overdue');
      expect(subject).toBe('OVERDUE: Invoice INV-1234 \u2014 Immediate Payment Required');
    });

    it('defaults to formal if no template specified', () => {
      const subject = getEmailSubject(mockInvoice);
      expect(subject).toBe('Invoice INV-1234 from John Doe');
    });
  });

  describe('getEmailBody', () => {
    it('generates formal body with all details', () => {
      const body = getEmailBody(mockInvoice, 'formal');
      expect(body).toContain('Dear Acme Corp');
      expect(body).toContain('Web Design (1 x ');
      expect(body).toContain('100,000.00');
      expect(body).toContain('Bank: GTBank');
      expect(body).toContain('Account: 0123456789');
      expect(body).toContain('Additional Notes: Please pay promptly.');
    });

    it('handles formal body without notes', () => {
      const invoiceNoNotes = { ...mockInvoice, notes: undefined } as Invoice;
      const body = getEmailBody(invoiceNoNotes, 'formal');
      expect(body).not.toContain('Additional Notes:');
      expect(body).toContain('Kindly ensure payment is made');
    });

    it('handles line items with undefined prices gracefully', () => {
      const invoiceBadPrices = {
        ...mockInvoice,
        lineItems: [{ description: 'Freebie', quantity: 1, price: undefined as unknown as string }]
      } as Invoice;
      const body = getEmailBody(invoiceBadPrices, 'formal');
      expect(body).toContain('Freebie (1 x ');
    });

    it('generates casual body with all details', () => {
      const body = getEmailBody(mockInvoice, 'casual');
      expect(body).toContain('Hi Acme Corp! 👋');
      expect(body).toContain('Web Design');
      expect(body).toContain('Bank: GTBank');
      expect(body).toContain('Note: Please pay promptly.');
      expect(body).toContain('Cheers,\nJohn Doe');
    });

    it('handles casual body without notes', () => {
      const invoiceNoNotes = { ...mockInvoice, notes: undefined } as Invoice;
      const body = getEmailBody(invoiceNoNotes, 'casual');
      expect(body).not.toContain('Note:');
      expect(body).toContain('Let me know if you have any questions.');
    });

    it('generates followup body', () => {
      const body = getEmailBody(mockInvoice, 'followup');
      expect(body).toContain('I wanted to follow up on invoice INV-1234 which was issued on 2024-01-01.');
      expect(body).toContain('Web Design');
      expect(body).toContain('Bank: GTBank');
      expect(body).toContain('Best,\nJohn Doe');
    });

    it('generates overdue body with days overdue', () => {
      const dateInPast = new Date();
      dateInPast.setDate(dateInPast.getDate() - 10);
      const overdueInvoice = { ...mockInvoice, dueDate: dateInPast.toISOString() } as Invoice;

      const body = getEmailBody(overdueInvoice, 'overdue');
      expect(body).toContain('is now overdue.');
      expect(body).toContain('Days Overdue: 10');
      // The text "Immediate payment of this outstanding balance" is in the body, not "Immediate Payment Required"
      expect(body).toContain('immediate payment of this outstanding balance');
    });

    it('generates overdue body with 0 days if due date is today or future', () => {
      const dateInFuture = new Date();
      dateInFuture.setDate(dateInFuture.getDate() + 10);
      const overdueInvoice = { ...mockInvoice, dueDate: dateInFuture.toISOString() } as Invoice;

      const body = getEmailBody(overdueInvoice, 'overdue');
      expect(body).toContain('Days Overdue: 0');
    });
  });

  describe('generateEmailTemplate', () => {
    it('combines subject and body into a single string', () => {
      const emailText = generateEmailTemplate(mockInvoice, 'formal');
      expect(emailText.startsWith('Subject: Invoice INV-1234 from John Doe\n\nDear Acme Corp')).toBe(true);
      expect(emailText).toContain('Bank: GTBank');
    });
  });
});
