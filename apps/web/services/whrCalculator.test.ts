import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectWHTType,
  calculateWHT,
  generateWHTCertificate,
  getWHTSummary,
  Invoice,
  registerWHTCategory,
  resetWHTCategories
} from './whrCalculator';

describe('whrCalculator', () => {
  describe('detectWHTType', () => {
    it('detects professional type from keywords', () => {
      expect(detectWHTType('Legal consulting services')).toBe('professional');
      expect(detectWHTType('Audit and advisory')).toBe('professional');
    });

    it('detects contract type from keywords', () => {
      expect(detectWHTType('Construction subcontract')).toBe('contract');
      expect(detectWHTType('IT equipment supply')).toBe('contract');
    });

    it('detects rent type from keywords', () => {
      expect(detectWHTType('Office space rent for 2024')).toBe('rent');
      expect(detectWHTType('Equipment lease')).toBe('rent');
    });

    it('detects dividend type from keywords', () => {
      expect(detectWHTType('Annual dividend distribution')).toBe('dividend');
      expect(detectWHTType('Shareholder bonus')).toBe('dividend');
    });

    it('defaults to professional for unknown descriptions', () => {
      expect(detectWHTType('General services')).toBe('professional');
      expect(detectWHTType('Random text')).toBe('professional');
    });

    it('is case insensitive', () => {
      expect(detectWHTType('LEGAL CONSULTING')).toBe('professional');
      expect(detectWHTType('RENT')).toBe('rent');
    });
  });

  describe('calculateWHT', () => {
    it('calculates 10% for professional', () => {
      expect(calculateWHT(1000, 'professional')).toBe(100);
    });

    it('calculates 5% for contract', () => {
      expect(calculateWHT(1000, 'contract')).toBe(50);
    });

    it('calculates 10% for rent', () => {
      expect(calculateWHT(1000, 'rent')).toBe(100);
    });

    it('calculates 10% for dividend', () => {
      expect(calculateWHT(1000, 'dividend')).toBe(100);
    });

    it('defaults to 10% for unknown type', () => {
      expect(calculateWHT(1000, 'unknown' as any)).toBe(100);
    });

    it('rounds to two decimal places', () => {
      expect(calculateWHT(100.5, 'professional')).toBe(10.05);
    });
  });

  describe('generateWHTCertificate', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('generates a WHT certificate from an invoice', () => {
      const invoice: Invoice = {
        id: 'INV-123',
        clientName: 'Acme Corp',
        clientTIN: '12345678-0001',
        amount: 5000,
        description: 'Office rent 2024',
        date: '2024-01-01'
      };

      const cert = generateWHTCertificate(invoice);

      expect(cert).toEqual({
        invoiceId: 'INV-123',
        payer: 'Acme Corp',
        payerTIN: '12345678-0001',
        payee: 'Acme Corp',
        amount: 5000,
        whtType: 'rent',
        whtRate: 0.10,
        whtAmount: 500,
        date: '2024-01-01',
        certificateNumber: 'WHT-INV-123-1704067200000'
      });
    });

    it('handles missing clientTIN', () => {
      const invoice: Invoice = {
        id: 'INV-456',
        clientName: 'Startup Inc',
        amount: 2000,
        description: 'Consulting services',
        date: '2024-01-02'
      };

      const cert = generateWHTCertificate(invoice);

      expect(cert.payerTIN).toBeUndefined();
      expect(cert.whtType).toBe('professional');
      expect(cert.whtAmount).toBe(200);
    });
  });

  describe('getWHTSummary', () => {
    it('summarizes multiple invoices correctly', () => {
      const invoices: Invoice[] = [
        {
          id: '1',
          clientName: 'Client A',
          amount: 1000,
          description: 'Legal consulting', // professional -> 100
          date: '2024-01-01'
        },
        {
          id: '2',
          clientName: 'Client B',
          amount: 2000,
          description: 'Construction supply', // contract -> 100
          date: '2024-01-02'
        },
        {
          id: '3',
          clientName: 'Client C',
          amount: 3000,
          description: 'IT consulting', // professional -> 300
          date: '2024-01-03'
        }
      ];

      const summary = getWHTSummary(invoices);

      expect(summary.totalInvoiced).toBe(6000);
      expect(summary.totalWHT).toBe(500); // 100 + 100 + 300
      expect(summary.byType).toEqual({
        professional: {
          count: 2,
          invoiced: 4000,
          wht: 400
        },
        contract: {
          count: 1,
          invoiced: 2000,
          wht: 100
        }
      });
    });

    it('returns empty summary for empty invoice array', () => {
      const summary = getWHTSummary([]);

      expect(summary).toEqual({
        totalInvoiced: 0,
        totalWHT: 0,
        byType: {}
      });
    });
  });
  describe('Extensibility', () => {
    afterEach(() => {
      resetWHTCategories();
    });

    it('allows registering a new WHT strategy', () => {
      registerWHTCategory({
        type: 'royalties',
        rate: 0.15,
        keywords: ['royalty', 'intellectual property', 'licensing fee']
      });

      expect(detectWHTType('Software licensing fee')).toBe('royalties');
      expect(calculateWHT(1000, 'royalties')).toBe(150);
    });

    it('throws error for invalid regex group types', () => {
      expect(() => {
        registerWHTCategory({
          type: 'invalid-type-name!',
          rate: 0.2,
          keywords: ['test']
        });
      }).toThrow();
    });
  });
});
