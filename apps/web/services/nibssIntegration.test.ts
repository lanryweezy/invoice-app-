import { describe, it, expect } from 'vitest';
import { getBankDetails, getSupportedBanks } from './nibssIntegration';

describe('nibssIntegration', () => {
  describe('getBankDetails', () => {
    it('should return bank details when looking up by exact code', () => {
      const bank = getBankDetails('044');
      expect(bank).toBeDefined();
      expect(bank?.name).toBe('Access Bank');
      expect(bank?.code).toBe('044');
    });

    it('should return bank details when looking up by alias', () => {
      const bank = getBankDetails('gtbank');
      expect(bank).toBeDefined();
      expect(bank?.name).toBe('Guaranty Trust Bank');
      expect(bank?.code).toBe('057');
    });

    it('should return bank details when looking up by exact name (case-insensitive)', () => {
      const bank = getBankDetails('zenith bank');
      expect(bank).toBeDefined();
      expect(bank?.code).toBe('050');
    });

    it('should handle uppercase strings and extra whitespace', () => {
      const bank = getBankDetails('  ZENITH BANK  ');
      expect(bank).toBeDefined();
      expect(bank?.code).toBe('050');
    });

    it('should return undefined for an unknown bank', () => {
      const bank = getBankDetails('Unknown Bank');
      expect(bank).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const bank = getBankDetails('');
      expect(bank).toBeUndefined();
    });
  });

  describe('getSupportedBanks', () => {
    it('should return an array of supported banks', () => {
      const banks = getSupportedBanks();
      expect(Array.isArray(banks)).toBe(true);
      expect(banks.length).toBeGreaterThan(0);
    });

    it('should return a copy of the array (immutability check)', () => {
      const banks1 = getSupportedBanks();
      const banks2 = getSupportedBanks();
      expect(banks1).not.toBe(banks2);
      expect(banks1).toEqual(banks2);
    });
  });
});
