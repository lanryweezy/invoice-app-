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
      expect(id).toBe('012345');
    });

    it('generates an ID of the requested length', () => {
      const id = generateSecureId(12);
      expect(id).toHaveLength(12);
      expect(id).toBe('0123456789AB');
    });

    it('generates strings longer than 32 characters securely without repeating entropy', () => {
      const id = generateSecureId(50);
      expect(id).toHaveLength(50);
      expect(id).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCD');
    });

    it('returns uppercase strings', () => {
      const id = generateSecureId(32);
      expect(id).toBe('0123456789ABCDEFGHIJKLMNOPQRSTUV');
    });
  });

  describe('computeInvoiceHash', () => {
    const baseInvoice = {
      invoiceNumber: 'INV-001',
      issueDate: '2024-01-01',
      dueDate: '2024-01-31',
      user: { tin: '12345' },
      client: { tin: '67890', name: 'Acme Corp' },
      total: 1000,
      currency: 'USD'
    } as unknown as Invoice;

    it('computes a consistent hash for a given invoice', () => {
      const hash1 = computeInvoiceHash(baseInvoice);
      const hash2 = computeInvoiceHash(baseInvoice);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8);
    });

    it('produces different hashes for different invoice data', () => {
      const invoice2 = { ...baseInvoice, invoiceNumber: 'INV-002' } as unknown as Invoice;
      expect(computeInvoiceHash(baseInvoice)).not.toBe(computeInvoiceHash(invoice2));
    });

    it('includes due date in hash only when specified', () => {
      const invoice2 = { ...baseInvoice, dueDate: '2024-02-15' } as unknown as Invoice;

      // By default, due date is not included
      expect(computeInvoiceHash(baseInvoice)).toBe(computeInvoiceHash(invoice2));

      // When includeDueDate is true, the hash should differ
      expect(computeInvoiceHash(baseInvoice, true)).not.toBe(computeInvoiceHash(invoice2, true));
    });

    it('handles missing optional fields gracefully', () => {
      const invoice = {
        invoiceNumber: 'INV-001',
        issueDate: '2024-01-01',
        user: {},
        client: { name: 'Acme Corp' },
        currency: 'USD'
      } as unknown as Invoice;

      const hash = computeInvoiceHash(invoice);
      expect(hash).toHaveLength(8);
    });
  });
});
