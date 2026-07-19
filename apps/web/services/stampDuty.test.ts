import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStampDutyRate, calculateStampDuty, generateStampReceipt } from './stampDuty';

describe('stampDuty', () => {
  describe('getStampDutyRate', () => {
    it('returns the correct rate for invoice', () => {
      expect(getStampDutyRate('invoice')).toBe(50);
    });

    it('returns the correct rate for contract', () => {
      expect(getStampDutyRate('contract')).toBe(200);
    });

    it('returns the correct rate for receipt', () => {
      expect(getStampDutyRate('receipt')).toBe(50);
    });

    it('returns 50 for unknown document types', () => {
      expect(getStampDutyRate('unknown' as any)).toBe(50);
    });
  });

  describe('calculateStampDuty', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('returns correct stamp duty result for invoice', () => {
      const result = calculateStampDuty('invoice', 1000);

      expect(result).toEqual({
        type: 'invoice',
        amount: 50,
        rate: 50,
        stampType: 'electronic',
        receiptNumber: expect.any(String),
        date: '2024-01-01T00:00:00.000Z'
      });
    });

    it('returns correct stamp duty result for contract', () => {
      const result = calculateStampDuty('contract', 5000);

      expect(result).toEqual({
        type: 'contract',
        amount: 200,
        rate: 200,
        stampType: 'electronic',
        receiptNumber: expect.any(String),
        date: '2024-01-01T00:00:00.000Z'
      });
    });
  });

  describe('generateStampReceipt', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    it('generates a stamp receipt with custom receipt number for invoice', () => {
      const result = generateStampReceipt({ id: 'INV-123', amount: 1000 });

      expect(result).toEqual({
        type: 'invoice',
        amount: 50,
        rate: 50,
        stampType: 'electronic',
        receiptNumber: 'SD-INV-123-1704067200000',
        date: '2024-01-01T00:00:00.000Z'
      });
    });

    it('generates a stamp receipt with custom receipt number for specified document type', () => {
      const result = generateStampReceipt({ id: 'CON-456', type: 'contract', amount: 5000 });

      expect(result).toEqual({
        type: 'contract',
        amount: 200,
        rate: 200,
        stampType: 'electronic',
        receiptNumber: 'SD-CON-456-1704067200000',
        date: '2024-01-01T00:00:00.000Z'
      });
    });
  });
});
