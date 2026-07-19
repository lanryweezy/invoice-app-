import { describe, it, expect } from 'vitest';
import { checkCompliance, suggestFixes, type ComplianceIssue } from './complianceTracker';
import type { Invoice } from '../types';

describe('complianceTracker', () => {
  const validInvoice: Invoice = {
    invoiceNumber: 'INV-001',
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    currency: 'NGN',
    total: 161250,
    status: 'pending',
    taxRate: 7.5,
    tax: 11250,
    whtRate: 5,
    whtAmount: 7500, // Added WHT amount to fix the last issue
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
      tin: '1234567890',
      bankName: 'GTB',
      accountNumber: '1234567890',
      cacNumber: 'RC123456',
    },
    client: {
      name: 'Acme Corp',
      email: 'billing@acme.com',
      address: '456 Market St',
      tin: '0987654321',
      cacNumber: 'RC654321',
    },
    lineItems: [
      { description: 'Service', quantity: 1, price: '150000', taxRate: 7.5 },
    ],
    notes: '',
  };

  describe('checkCompliance', () => {
    it('returns a 100% score for a fully compliant invoice', () => {
      const result = checkCompliance(validInvoice);
      expect(result.issues).toHaveLength(0);
      expect(result.score).toBe(100);
    });

    it('identifies missing user TIN', () => {
      const invalidInvoice = { ...validInvoice, user: { ...validInvoice.user, tin: '' } };
      const result = checkCompliance(invalidInvoice);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.some(i => i.field === 'supplier.tin')).toBe(true);
    });
  });

  describe('suggestFixes', () => {
    it('includes default suggestions and strategy suggestions for TIN', () => {
      const issue: ComplianceIssue = {
        id: '123',
        category: 'TIN',
        field: 'customer.tin',
        severity: 'error',
        message: 'Missing TIN',
        suggestion: 'Request customer TIN',
        autoFixable: false,
        fixed: false,
      };
      const suggestions = suggestFixes(issue);
      expect(suggestions).toContain('Request customer TIN');
      expect(suggestions).toContain('TIN can be verified on FIRS portal: https://taxpromax.firs.gov.ng');
      expect(suggestions).toContain('Request customer TIN before issuing invoice');
    });
  });
});
