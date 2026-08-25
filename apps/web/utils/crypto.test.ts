import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSecureId, computeInvoiceHash } from './crypto';
import type { Invoice } from '../types';

describe('crypto', () => {
  describe('generateSecureId', () => {
    beforeEach(() => {
      vi.stubGlobal('crypto', {
        getRandomValues: vi.fn((arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i % 256;
          }
          return arr;
        })
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('generates a 6-character ID by default', () => {
      const id = generateSecureId();
      expect(id).toHaveLength(6);
      expect(id).toBe('000102');
    });

    it('generates an ID of the requested length', () => {
      const id = generateSecureId(12);
      expect(id).toHaveLength(12);
      expect(id).toBe('000102030405');
    });

    it('generates strings longer than 32 characters securely without repeating entropy', () => {
      const id = generateSecureId(50);
      expect(id).toHaveLength(50);
      expect(id).toBe('000102030405060708090A0B0C0D0E0F101112131415161718');
    });

    it('returns uppercase strings', () => {
      const id = generateSecureId(32);
      expect(id).toBe('000102030405060708090A0B0C0D0E0F');
    });
  });

  describe('computeInvoiceHash', () => {
    const baseInvoice: Partial<Invoice> = {
      invoiceNumber: 'INV-001',
      issueDate: '2023-01-01',
      dueDate: '2023-01-31',
      user: {
        name: 'My Business',
        email: 'me@business.com',
        address: '123 Business Rd',
        bankName: 'Bank',
        accountNumber: '1234567890',
        tin: 'TIN123'
      },
      client: {
        name: 'Acme Corp',
        email: 'acme@corp.com',
        address: '456 Client St',
        tin: 'TIN456'
      },
      total: 1000,
      currency: 'USD'
    };

    it('computes a consistent deterministic hash for a given invoice', () => {
      const hash1 = computeInvoiceHash(baseInvoice as Invoice);
      const hash2 = computeInvoiceHash(baseInvoice as Invoice);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{8}$/);
    });

    it('optionally includes the due date when the flag is true', () => {
      const hashWithoutDueDate = computeInvoiceHash(baseInvoice as Invoice, false);
      const hashWithDueDate = computeInvoiceHash(baseInvoice as Invoice, true);
      expect(hashWithDueDate).not.toBe(hashWithoutDueDate);
    });

    it('produces different hashes for different invoices', () => {
      const invoice2 = { ...baseInvoice, invoiceNumber: 'INV-002' };
      const hash1 = computeInvoiceHash(baseInvoice as Invoice);
      const hash2 = computeInvoiceHash(invoice2 as Invoice);
      expect(hash1).not.toBe(hash2);
    });

    it('handles empty or missing TIN numbers gracefully', () => {
      const invoiceWithoutTIN = {
        ...baseInvoice,
        user: { ...baseInvoice.user, tin: undefined },
        client: { ...baseInvoice.client, tin: undefined }
      };

      const hash = computeInvoiceHash(invoiceWithoutTIN as Invoice);
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^[0-9a-f]{8}$/);
    });
  });
});
