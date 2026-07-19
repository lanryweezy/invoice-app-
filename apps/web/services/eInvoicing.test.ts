import { describe, it, expect } from 'vitest';
import { validateNRSCompliance } from './eInvoicing';
import type { Invoice } from '../types';

describe('eInvoicing', () => {
  const validInvoice: Invoice = {
    invoiceNumber: 'INV-100',
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    currency: 'NGN',
    total: 10750,
    status: 'pending',
    taxRate: 7.5,
    user: {
      name: 'Supplier LLC',
      tin: '1234567890',
      cacNumber: 'RC111',
      address: '123 Supply St',
      email: 'sup@llc.com',
    },
    client: {
      name: 'Client Inc',
      tin: '0987654321',
      address: '456 Client St',
    },
    lineItems: [
      { description: 'Item 1', quantity: 1, price: '10000', taxRate: 7.5 },
    ],
  } as unknown as Invoice;

  describe('validateNRSCompliance', () => {
    it('returns compliant=true with 0 errors for a valid invoice', () => {
      const result = validateNRSCompliance(validInvoice);
      expect(result.compliant).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns compliant=false when supplier TIN is missing', () => {
      const invalid = { ...validInvoice, user: { ...validInvoice.user, tin: '' } } as Invoice;
      const result = validateNRSCompliance(invalid);
      expect(result.compliant).toBe(false);
      expect(result.errors.some(e => e.field === 'supplier.tin')).toBe(true);
    });

    it('returns errors when client TIN is missing', () => {
      const warning = { ...validInvoice, client: { ...validInvoice.client, tin: '' } } as Invoice;
      const result = validateNRSCompliance(warning);
      expect(result.compliant).toBe(false);
      expect(result.errors.some(e => e.field === 'customer.tin')).toBe(true);
    });

    it('returns compliant=false when total is zero', () => {
      const invalid = { ...validInvoice, lineItems: [], total: 0 } as unknown as Invoice;
      const result = validateNRSCompliance(invalid);
      expect(result.compliant).toBe(false);
      expect(result.errors.some(e => e.field === 'total' || e.field === 'lineItems')).toBe(true);
    });
  });
});
