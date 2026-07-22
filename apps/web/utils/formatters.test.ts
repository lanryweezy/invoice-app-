import { describe, it, expect } from 'vitest';
import { formatCurrency, getCurrencyFormatter } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats amount with currency symbol using default locale (en-US)', () => {
      // Use replace space to standard space as node environments differ
      const result = formatCurrency(1000.5, 'USD');
      expect(result).toBe('$1,000.50');
    });

    it('formats amount correctly with specific locale', () => {
      // German locale uses comma for decimal and dot for thousands
      const result = formatCurrency(1000.5, 'EUR', 'de-DE');

      // Node outputs string with non-breaking spaces for euro symbols
      expect(result.replace(/\s/g, ' ')).toContain('1.000,50');
    });
  });

  describe('getCurrencyFormatter', () => {
    it('reuses the same Intl.NumberFormat instance for identical locale and currency', () => {
      const formatter1 = getCurrencyFormatter('USD', 'en-US');
      const formatter2 = getCurrencyFormatter('USD', 'en-US');

      expect(formatter1).toBe(formatter2);
    });

    it('creates distinct instances for different currencies', () => {
      const formatterUSD = getCurrencyFormatter('USD', 'en-US');
      const formatterGBP = getCurrencyFormatter('GBP', 'en-US');

      expect(formatterUSD).not.toBe(formatterGBP);
    });
  });
});
