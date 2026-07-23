import { describe, it, expect } from 'vitest';
import { formatCurrency, getCurrencyFormatter } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats a number as USD currency by default', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toMatch(/\$1,000\.00/);
    });

    it('formats a number as a specific currency and locale', () => {
      const result = formatCurrency(5000, 'EUR', 'de-DE');
      // German locale uses comma for decimal and dot for thousands, e.g. "5.000,00 €"
      expect(result).toContain('5.000,00');
    });

    it('handles zero correctly', () => {
      const result = formatCurrency(0, 'USD');
      expect(result).toMatch(/\$0\.00/);
    });
  });

  describe('getCurrencyFormatter', () => {
    it('returns the same Intl.NumberFormat instance for identical currency and locale (caching)', () => {
      const formatter1 = getCurrencyFormatter('USD', 'en-US');
      const formatter2 = getCurrencyFormatter('USD', 'en-US');
      expect(formatter1).toBe(formatter2);
    });

    it('returns different instances for different currencies', () => {
      const formatter1 = getCurrencyFormatter('USD', 'en-US');
      const formatter2 = getCurrencyFormatter('EUR', 'en-US');
      expect(formatter1).not.toBe(formatter2);
    });
  });
});
