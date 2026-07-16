import { describe, it, expect } from 'vitest';
import {
  calculateVAT,
  calculateWHT,
  calculateStampDuty,
  getTaxBreakdown,
} from './tax-calculator';
import { LineItem } from '../types';

describe('calculateVAT', () => {
  it('returns 7500 for 100000 at default 7.5% rate', () => {
    expect(calculateVAT(100000)).toBe(7500);
  });

  it('returns 0 for 0 amount', () => {
    expect(calculateVAT(0)).toBe(0);
  });

  it('applies custom rate', () => {
    expect(calculateVAT(100000, 10)).toBe(10000);
  });
});

describe('calculateWHT', () => {
  it('returns 5000 for 100000 at default 5% rate', () => {
    expect(calculateWHT(100000)).toBe(5000);
  });

  it('returns 10000 for 100000 at 10% rate', () => {
    expect(calculateWHT(100000, 10)).toBe(10000);
  });

  it('returns 5000 for 100000 at 5% rate', () => {
    expect(calculateWHT(100000, 5)).toBe(5000);
  });

  it('returns 0 for 0 amount', () => {
    expect(calculateWHT(0, 5)).toBe(0);
  });
});

describe('calculateStampDuty', () => {
  it('returns 0 for amounts <= 1000', () => {
    expect(calculateStampDuty(500)).toBe(0);
  });

  it('returns 10 for amounts between 1001 and 5000', () => {
    expect(calculateStampDuty(2000)).toBe(10);
  });

  it('returns 20 for amounts between 5001 and 50000', () => {
    expect(calculateStampDuty(30000)).toBe(20);
  });

  it('returns 50 for amounts between 50001 and 100000', () => {
    expect(calculateStampDuty(100000)).toBe(50);
  });

  it('returns 100 for amounts > 100000', () => {
    expect(calculateStampDuty(150000)).toBe(100);
  });
});

describe('getTaxBreakdown', () => {
  const standardItems: LineItem[] = [
    { id: '1', description: 'Design', quantity: 1, price: 100000 },
    { id: '2', description: 'Development', quantity: 1, price: 50000 },
  ];

  it('returns correct breakdown for standard items', () => {
    const breakdown = getTaxBreakdown(standardItems);

    expect(breakdown.subtotal).toBe(150000);
    expect(breakdown.discountAmount).toBe(0);
    expect(breakdown.taxableAmount).toBe(150000);
    expect(breakdown.vatAmount).toBe(11250); // 150000 * 7.5%
    expect(breakdown.whtAmount).toBe(7500); // 150000 * 5%
    expect(breakdown.stampDuty).toBe(100); // >100000
    expect(breakdown.total).toBe(153850); // 150000 + 11250 - 7500 + 100
  });

  it('returns 0 VAT on exempt items', () => {
    const items: LineItem[] = [
      { id: '1', description: 'Food', quantity: 1, price: 50000, taxCategory: 'Exempt' },
      { id: '2', description: 'Service', quantity: 1, price: 100000 },
    ];

    const breakdown = getTaxBreakdown(items);

    expect(breakdown.subtotal).toBe(150000);
    // Only the Service item (100000) is VATable
    expect(breakdown.vatAmount).toBe(7500); // 100000 * 7.5%
    expect(breakdown.whtAmount).toBe(7500); // 150000 * 5%
  });

  it('applies percentage discount correctly', () => {
    const breakdown = getTaxBreakdown(standardItems, 7.5, 5, 10, 'percentage');

    expect(breakdown.discountAmount).toBe(15000); // 150000 * 10%
    expect(breakdown.taxableAmount).toBe(135000);
  });

  it('applies fixed discount correctly', () => {
    const breakdown = getTaxBreakdown(standardItems, 7.5, 5, 20000, 'fixed');

    expect(breakdown.discountAmount).toBe(20000);
    expect(breakdown.taxableAmount).toBe(130000);
  });

  it('includes shipping in total', () => {
    const breakdown = getTaxBreakdown(standardItems, 7.5, 5, 0, 'percentage', 5000);

    expect(breakdown.shipping).toBe(5000);
    expect(breakdown.total).toBe(158850); // 150000 + 11250 - 7500 + 100 + 5000
  });

  it('returns zero breakdown for empty items', () => {
    const breakdown = getTaxBreakdown([]);

    expect(breakdown.subtotal).toBe(0);
    expect(breakdown.vatAmount).toBe(0);
    expect(breakdown.whtAmount).toBe(0);
    expect(breakdown.total).toBe(0);
  });
});
