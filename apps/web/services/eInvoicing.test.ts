import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateNRSJSON, validateNRSCompliance } from './eInvoicing';
import type { Invoice } from '../types';

describe('eInvoicing', () => {
  describe('generateNRSJSON', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-03-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should correctly generate an NRSInvoiceJSON object from an Invoice', () => {
      const mockInvoice: Invoice = {
        invoiceNumber: 'INV-2024-001',
        issueDate: '2024-03-15',
        dueDate: '2024-04-14',
        documentType: 'Tax Invoice',
        currency: 'NGN',
        user: {
          name: 'Acme Corp',
          tin: '1234567890',
          cacNumber: 'RC123456',
          address: '123 Main St, Lagos',
          email: 'acme@example.com',
          phoneNumber: '+2348000000000',
          bankName: 'Test Bank',
          accountNumber: '0000000000',
        },
        client: {
          name: 'Client XYZ',
          tin: '0987654321',
          cacNumber: 'RC654321',
          address: '456 Client Ave, Abuja',
          email: 'client@example.com',
        },
        lineItems: [
          {
            id: 'item1',
            description: 'Consulting Services',
            quantity: 10,
            price: 5000,
            taxCategory: 'Standard',
            unitOfMeasure: 'HRS',
          },
          {
            id: 'item2',
            description: 'Software License',
            quantity: 1,
            price: 150000,
            taxCategory: 'Standard',
            unitOfMeasure: 'PCS',
          },
        ],
        notes: '',
        terms: '',
        taxRate: 7.5,
        whtRate: 5,
        discountRate: 10,
        discountType: 'percentage',
        shippingAmount: 5000,
        status: 'Draft',
      };

      const result = generateNRSJSON(mockInvoice);

      // Verify basic fields
      expect(result.version).toBe('1.0.0');
      expect(result.invoiceNumber).toBe('INV-2024-001');
      expect(result.issueDate).toBe('2024-03-15');
      expect(result.dueDate).toBe('2024-04-14');
      expect(result.invoiceType).toBe('Tax Invoice');
      expect(result.currency).toBe('NGN');

      // Verify supplier
      expect(result.supplier).toEqual({
        name: 'Acme Corp',
        tin: '1234567890',
        cacNumber: 'RC123456',
        address: '123 Main St, Lagos',
        email: 'acme@example.com',
        phoneNumber: '+2348000000000',
      });

      // Verify customer
      expect(result.customer).toEqual({
        name: 'Client XYZ',
        tin: '0987654321',
        cacNumber: 'RC654321',
        address: '456 Client Ave, Abuja',
        email: 'client@example.com',
      });

      // Verify line items (10*5000 = 50000, 1*150000 = 150000)
      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0]).toEqual({
        description: 'Consulting Services',
        quantity: 10,
        unitPrice: 5000,
        taxCategory: 'Standard',
        unitOfMeasure: 'HRS',
        lineTotal: 50000,
      });

      // Verify totals
      // subtotal = 50000 + 150000 = 200000
      // discount = 10% of 200000 = 20000
      // afterDiscount = 180000
      // taxAmount (VAT 7.5% on vatable line items, ignores discount) = 200000 * 0.075 = 15000
      // whtAmount (5% on afterDiscount) = 180000 * 0.05 = 9000
      // shipping = 5000
      // totalAmount = 180000 + 15000 - 9000 + 5000 = 191000
      expect(result.totals.subtotal).toBe(200000);
      expect(result.totals.discountAmount).toBe(20000);
      expect(result.totals.taxAmount).toBe(15000);
      expect(result.totals.whtAmount).toBe(9000);
      expect(result.totals.shippingAmount).toBe(5000);
      expect(result.totals.totalAmount).toBe(191000);

      // Verify tax details
      expect(result.taxDetails.vatRate).toBe(0.075);
      expect(result.taxDetails.vatAmount).toBe(15000);
      expect(result.taxDetails.whtRate).toBe(5);
      expect(result.taxDetails.whtAmount).toBe(9000);

      // Verify metadata
      expect(result.metadata.generatedAt).toBe('2024-03-15T12:00:00.000Z');
      expect(result.metadata.generatorVersion).toBe('1.0.0');
      expect(result.metadata.invoiceHash).toBeDefined();
      expect(typeof result.metadata.invoiceHash).toBe('string');
    });

    it('should handle optional/missing fields gracefully', () => {
      const minimalInvoice: Invoice = {
        invoiceNumber: 'INV-002',
        issueDate: '2024-03-15',
        dueDate: '2024-03-15',
        currency: 'NGN',
        user: {
          name: 'Minimal Corp',
          address: 'Some Address',
          bankName: 'Bank',
          accountNumber: '123',
          email: 'min@example.com',
        },
        client: {
          name: 'Minimal Client',
          address: 'Client Address',
          email: 'client@example.com',
        },
        lineItems: [
          {
            id: 'item1',
            description: 'Item',
            quantity: 1,
            price: 100,
          }
        ],
        notes: '',
        terms: '',
        taxRate: 0,
        whtRate: 0,
        discountRate: 0,
        discountType: 'fixed',
        shippingAmount: 0,
        status: 'Draft',
      };

      const result = generateNRSJSON(minimalInvoice);

      expect(result.invoiceType).toBe('Tax Invoice'); // Defaults to Tax Invoice
      expect(result.supplier.tin).toBe('');
      expect(result.supplier.cacNumber).toBe('');
      expect(result.customer.tin).toBe('');
      expect(result.lineItems[0].taxCategory).toBe('Standard'); // Default
      expect(result.lineItems[0].unitOfMeasure).toBe('PCS'); // Default
    });
  });

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
