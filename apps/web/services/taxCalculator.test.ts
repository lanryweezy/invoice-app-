import { describe, it, expect } from 'vitest';
import { calculateVAT, calculateWHT, calculateStampDuty } from './taxCalculator';

describe('taxCalculator', () => {
  describe('calculateVAT', () => {
    it('returns 7.5% of the subtotal rounded to 2 decimal places', () => {
      expect(calculateVAT(100)).toBe(7.5);
      expect(calculateVAT(1000)).toBe(75);
      expect(calculateVAT(123.45)).toBe(9.26); // 9.25875 rounded up
    });

    it('returns 0 when subtotal is 0', () => {
      expect(calculateVAT(0)).toBe(0);
    });
  });

  describe('calculateWHT', () => {
    it('returns correct WHT for professional services (10%)', () => {
      expect(calculateWHT(1000, 'professional')).toBe(100);
    });

    it('returns correct WHT for contract services (5%)', () => {
      expect(calculateWHT(1000, 'contract')).toBe(50);
    });

    it('returns correct WHT for rent (10%)', () => {
      expect(calculateWHT(1000, 'rent')).toBe(100);
    });

    it('returns correct WHT for dividend (10%)', () => {
      expect(calculateWHT(1000, 'dividend')).toBe(100);
    });

    it('returns 0 for unknown WHT types', () => {
      expect(calculateWHT(1000, 'unknown')).toBe(0);
    });

    it('handles rounding correctly', () => {
      expect(calculateWHT(123.45, 'contract')).toBe(6.17); // 6.1725 rounded down
    });

    it('returns 0 when amount is 0', () => {
      expect(calculateWHT(0, 'professional')).toBe(0);
    });
  });

  describe('calculateStampDuty', () => {
    it('returns 50 for amounts up to 1000', () => {
      expect(calculateStampDuty(0)).toBe(50);
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

    it('returns 500 for amounts over 50000', () => {
      expect(calculateStampDuty(50001)).toBe(500);
      expect(calculateStampDuty(1000000)).toBe(500);
    });
  });
});
