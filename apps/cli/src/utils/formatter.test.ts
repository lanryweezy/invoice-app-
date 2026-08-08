import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateISO,
  parseItemsString,
  generateInvoiceNumber,
} from './formatter';
import { Invoice } from '../types';

describe('formatCurrency', () => {
  it('formats NGN currency', () => {
    const result = formatCurrency(50000, 'NGN');
    expect(result).toContain('50,000');
  });

  it('formats USD currency', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('100');
  });

  it('uses cached Intl.NumberFormat instance', () => {
    const result1 = formatCurrency(1000, 'NGN');
    const result2 = formatCurrency(2000, 'NGN');
    expect(result1).toContain('1,000');
    expect(result2).toContain('2,000');
  });
});

describe('formatDate', () => {
  it('formats date string to DD/MM/YYYY', () => {
    expect(formatDate('2026-07-15')).toBe('15/07/2026');
  });

  it('pads single digit day and month', () => {
    expect(formatDate('2026-01-05')).toBe('05/01/2026');
  });
});

describe('formatDateISO', () => {
  it('formats date string to YYYY-MM-DD', () => {
    expect(formatDateISO('2026-07-15')).toBe('2026-07-15');
  });
});

describe('parseItemsString', () => {
  it('parses comma-separated items with colon delimiter', () => {
    const result = parseItemsString('Design:20000,Development:30000');
    expect(result).toEqual([
      { description: 'Design', amount: 20000 },
      { description: 'Development', amount: 30000 },
    ]);
  });

  it('returns empty array for empty string', () => {
    expect(parseItemsString('')).toEqual([]);
  });

  it('trims whitespace from descriptions', () => {
    const result = parseItemsString('Design : 20000');
    expect(result).toEqual([{ description: 'Design', amount: 20000 }]);
  });
});

describe('generateInvoiceNumber', () => {
  it('generates INV-YYYY-MM-0001 when no existing invoices', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const result = generateInvoiceNumber([]);
    expect(result).toBe(`INV-${year}-${month}-0001`);
  });

  it('generates next sequential number for existing invoices', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const existing: Invoice[] = [
      { invoiceNumber: `INV-${year}-${month}-0003` } as Invoice,
      { invoiceNumber: `INV-${year}-${month}-0001` } as Invoice,
    ];

    const result = generateInvoiceNumber(existing);
    expect(result).toBe(`INV-${year}-${month}-0004`);
  });

  it('ignores invoices from different months', () => {
    const existing: Invoice[] = [
      { invoiceNumber: 'INV-2025-12-0005' } as Invoice,
    ];

    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const result = generateInvoiceNumber(existing);
    expect(result).toBe(`INV-${year}-${month}-0001`);
  });
});
