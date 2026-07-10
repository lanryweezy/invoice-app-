import { describe, it, expect } from 'vitest';
import { calculateVAT, calculateWHT, calculateStampDuty, getVATableTotal } from './taxCalculator';

describe('taxCalculator', () => {
  it('calculates VAT and handles floating point precision correctly', () => {
    expect(calculateVAT(10.05)).toBe(0.75); // 10.05 * 0.075 = 0.75375 -> 0.75
    expect(calculateVAT(10.07)).toBe(0.76); // 10.07 * 0.075 = 0.75525 -> 0.76
  });

  it('calculates WHT with known rates and safely falls back to 0 for unknown types', () => {
    expect(calculateWHT(100, 'professional')).toBe(10);
    expect(calculateWHT(100, 'contract')).toBe(5);
    expect(calculateWHT(100, 'unknown')).toBe(0);
  });

  it('applies correct tiered stamp duty rates for various amounts', () => {
    expect(calculateStampDuty(1000)).toBe(50);
    expect(calculateStampDuty(5000)).toBe(100);
    expect(calculateStampDuty(50000)).toBe(200);
    expect(calculateStampDuty(100000)).toBe(500);
  });

  it('calculates vatable total by summing only standard type items', () => {
    const items = [
      { description: 'A', amount: 100, type: 'standard' as const },
      { description: 'B', amount: 50, type: 'exempt' as const },
    ];
    expect(getVATableTotal(items)).toBe(100);
  });
});
