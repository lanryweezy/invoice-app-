import { describe, it, expect } from 'vitest';
import {
  calculateVAT,
  calculateWHT,
  calculateStampDuty,
  getVATableTotal,
  calculateTotalTax,
  getTaxBreakdown,
  TaxItem,
  Invoice,
} from './taxCalculator';

describe('taxCalculator', () => {
  describe('calculateVAT', () => {
    it('calculates 7.5% VAT on the given subtotal', () => {
      const subtotal = 1000;

      const result = calculateVAT(subtotal);

      expect(result).toBe(75);
    });

    it('rounds the VAT amount to two decimal places', () => {
      const subtotal = 1000.55; // 1000.55 * 0.075 = 75.04125 -> 75.04

      const result = calculateVAT(subtotal);

      expect(result).toBe(75.04);
    });

    it('returns 0 when subtotal is 0', () => {
      const result = calculateVAT(0);

      expect(result).toBe(0);
    });
  });

  describe('calculateWHT', () => {
    it('calculates 10% WHT for professional services', () => {
      const amount = 1000;

      const result = calculateWHT(amount, 'professional');

      expect(result).toBe(100);
    });

    it('calculates 5% WHT for contract services', () => {
      const amount = 1000;

      const result = calculateWHT(amount, 'contract');

      expect(result).toBe(50);
    });

    it('returns 0 when the WHT type is unknown', () => {
      const amount = 1000;

      const result = calculateWHT(amount, 'unknown-type');

      expect(result).toBe(0);
    });

    it('rounds the WHT amount to two decimal places', () => {
      const amount = 1000.55; // 1000.55 * 0.10 = 100.055 -> 100.06

      const result = calculateWHT(amount, 'professional');

      expect(result).toBe(100.06); // 100.055 rounded is 100.06? Wait. 100.055 * 100 = 10005.5 -> round -> 10006 / 100 = 100.06.
    });
  });

  describe('calculateStampDuty', () => {
    it('returns 50 for amounts up to 1000', () => {
      expect(calculateStampDuty(500)).toBe(50);
      expect(calculateStampDuty(1000)).toBe(50);
    });

    it('returns 100 for amounts between 1001 and 5000', () => {
      expect(calculateStampDuty(1001)).toBe(100);
      expect(calculateStampDuty(5000)).toBe(100);
    });

    it('returns 200 for amounts between 5001 and 50000', () => {
      expect(calculateStampDuty(5001)).toBe(200);
      expect(calculateStampDuty(50000)).toBe(200);
    });

    it('returns 500 for amounts above 50000', () => {
      expect(calculateStampDuty(50001)).toBe(500);
      expect(calculateStampDuty(100000)).toBe(500);
    });
  });

  describe('getVATableTotal', () => {
    it('sums the amounts of standard tax items', () => {
      const items: TaxItem[] = [
        { description: 'Item 1', amount: 100, type: 'standard' },
        { description: 'Item 2', amount: 200, type: 'standard' },
      ];

      const result = getVATableTotal(items);

      expect(result).toBe(300);
    });

    it('ignores exempt and zero-rated items', () => {
      const items: TaxItem[] = [
        { description: 'Item 1', amount: 100, type: 'standard' },
        { description: 'Item 2', amount: 200, type: 'exempt' },
        { description: 'Item 3', amount: 300, type: 'zero-rated' },
      ];

      const result = getVATableTotal(items);

      expect(result).toBe(100);
    });

    it('returns 0 when there are no items', () => {
      const result = getVATableTotal([]);

      expect(result).toBe(0);
    });
  });

  describe('getTaxBreakdown', () => {
    it('calculates the full tax breakdown for an invoice with standard items', () => {
      const invoice: Invoice = {
        items: [
          { description: 'Consulting', amount: 10000, type: 'standard' },
        ],
        whtType: 'professional',
      };

      const breakdown = getTaxBreakdown(invoice);

      expect(breakdown).toEqual({
        subtotal: 10000,
        vat: 750, // 10000 * 0.075
        wht: 1000, // 10000 * 0.10
        stampDuty: 200, // 10000 falls in 5001-50000
        totalTax: 950, // 750 + 200
        grandTotal: 9950, // 10000 + 950 - 1000
        vatRate: 0.075,
        whtRate: 0.10,
      });
    });

    it('defaults to professional WHT if no whtType is provided', () => {
      const invoice: Invoice = {
        items: [
          { description: 'Consulting', amount: 10000, type: 'standard' },
        ],
      };

      const breakdown = getTaxBreakdown(invoice);

      expect(breakdown.whtRate).toBe(0.10);
      expect(breakdown.wht).toBe(1000);
    });

    it('calculates correctly for invoices with mixed item types', () => {
      const invoice: Invoice = {
        items: [
          { description: 'Services', amount: 5000, type: 'standard' },
          { description: 'Exempt Goods', amount: 2000, type: 'exempt' },
        ],
        whtType: 'contract',
      };

      // subtotal = 7000
      // vatable = 5000 -> vat = 375
      // stampDuty for 7000 is 200
      // wht for 7000 at 5% is 350
      // totalTax = 375 + 200 = 575
      // grandTotal = 7000 + 575 - 350 = 7225

      const breakdown = getTaxBreakdown(invoice);

      expect(breakdown.subtotal).toBe(7000);
      expect(breakdown.vat).toBe(375);
      expect(breakdown.wht).toBe(350);
      expect(breakdown.stampDuty).toBe(200);
      expect(breakdown.totalTax).toBe(575);
      expect(breakdown.grandTotal).toBe(7225);
    });
  });

  describe('calculateTotalTax', () => {
    it('returns just the total tax value for an invoice', () => {
      const invoice: Invoice = {
        items: [
          { description: 'Consulting', amount: 10000, type: 'standard' },
        ],
        whtType: 'professional',
      };

      // vat (750) + stamp duty (200) = 950
      const totalTax = calculateTotalTax(invoice);

      expect(totalTax).toBe(950);
    });
  });
});

describe('taxCalculator missing branch', () => {
  it('covers unknown whtType in getTaxBreakdown', () => {
    const invoice = { items: [], whtType: 'unknown' as any };
    const breakdown = getTaxBreakdown(invoice);
    expect(breakdown.whtRate).toBe(0);
  });
});
