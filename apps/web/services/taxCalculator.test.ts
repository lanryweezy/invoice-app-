import { describe, it, expect } from 'vitest';
import {
  calculateVAT,
  calculateWHT,
  calculateStampDuty,
  getVATableTotal,
  calculateTotalTax,
  getTaxBreakdown,
  Invoice,
  TaxItem
} from './taxCalculator';

describe('taxCalculator', () => {
  describe('calculateVAT', () => {
    it('calculates 7.5% VAT and rounds to two decimal places', () => {
      expect(calculateVAT(100)).toBe(7.5);
      expect(calculateVAT(100.5)).toBe(7.54);
    });
  });

  describe('calculateWHT', () => {
    it('calculates WHT correctly for known types', () => {
      expect(calculateWHT(1000, 'professional')).toBe(100); // 10%
      expect(calculateWHT(1000, 'contract')).toBe(50); // 5%
      expect(calculateWHT(1000, 'rent')).toBe(100); // 10%
      expect(calculateWHT(1000, 'dividend')).toBe(100); // 10%
    });

    it('returns 0 WHT for unknown types', () => {
      expect(calculateWHT(1000, 'unknown')).toBe(0);
    });
  });

  describe('calculateStampDuty', () => {
    it('returns 50 for amount <= 1000', () => {
      expect(calculateStampDuty(500)).toBe(50);
      expect(calculateStampDuty(1000)).toBe(50);
    });

    it('returns 100 for amount <= 5000', () => {
      expect(calculateStampDuty(1001)).toBe(100);
      expect(calculateStampDuty(5000)).toBe(100);
    });

    it('returns 200 for amount <= 50000', () => {
      expect(calculateStampDuty(5001)).toBe(200);
      expect(calculateStampDuty(50000)).toBe(200);
    });

    it('returns 500 for amount > 50000', () => {
      expect(calculateStampDuty(50001)).toBe(500);
      expect(calculateStampDuty(100000)).toBe(500);
    });
  });

  describe('getVATableTotal', () => {
    it('sums only standard items and ignores exempt and zero-rated items', () => {
      const items: TaxItem[] = [
        { description: 'Standard 1', amount: 100, type: 'standard' },
        { description: 'Exempt', amount: 200, type: 'exempt' },
        { description: 'Zero Rated', amount: 300, type: 'zero-rated' },
        { description: 'Standard 2', amount: 50, type: 'standard' },
      ];
      expect(getVATableTotal(items)).toBe(150);
    });
  });

  describe('getTaxBreakdown', () => {
    it('calculates full tax breakdown for an invoice correctly', () => {
      const invoice: Invoice = {
        items: [
          { description: 'Consulting', amount: 20000, type: 'standard' },
          { description: 'Travel', amount: 5000, type: 'exempt' },
        ],
        whtType: 'professional'
      };

      const breakdown = getTaxBreakdown(invoice);

      expect(breakdown.subtotal).toBe(25000); // 20000 + 5000
      expect(breakdown.vat).toBe(1500); // 7.5% of 20000
      expect(breakdown.wht).toBe(2500); // 10% of 25000
      expect(breakdown.stampDuty).toBe(200); // amount <= 50000
      expect(breakdown.totalTax).toBe(1700); // vat (1500) + stampDuty (200)
      expect(breakdown.grandTotal).toBe(24200); // 25000 + 1700 - 2500
      expect(breakdown.vatRate).toBe(0.075);
      expect(breakdown.whtRate).toBe(0.10);
    });

    it('uses professional WHT type as default when not provided', () => {
      const invoice: Invoice = {
        items: [
          { description: 'Consulting', amount: 1000, type: 'standard' },
        ]
      };

      const breakdown = getTaxBreakdown(invoice);

      expect(breakdown.whtRate).toBe(0.10); // Professional rate
      expect(breakdown.wht).toBe(100);
    });
  });

  describe('calculateTotalTax', () => {
    it('returns the total tax amount (VAT + Stamp Duty)', () => {
      const invoice: Invoice = {
        items: [
          { description: 'Item 1', amount: 1000, type: 'standard' }
        ],
      };
      // VAT: 75, Stamp Duty: 50 => Total Tax: 125
      expect(calculateTotalTax(invoice)).toBe(125);
    });
  });
});

  describe('calculateWHT with edge cases', () => {
    it('returns 0 WHT for unknown whtType', () => {
        const invoice: Invoice = {
            items: [ { description: 'Item 1', amount: 1000, type: 'standard' } ],
            whtType: 'unknown' as any
        };
        const breakdown = getTaxBreakdown(invoice);
        expect(breakdown.whtRate).toBe(0);
        expect(breakdown.wht).toBe(0);
    });
  });
