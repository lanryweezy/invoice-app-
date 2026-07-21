import { describe, it, expect } from 'vitest';
import { getBankDetails, getSupportedBanks, generatePaymentLink } from './nibssIntegration';

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

  describe('generatePaymentLink', () => {
    it('successfully generates a link for valid inputs', () => {
      const amount = 10000;
      const bank = '044';
      const accountNumber = '1234567890';
      const customerName = 'John Doe';

      const link = generatePaymentLink(amount, bank, accountNumber, customerName);

      expect(link).toBeDefined();
      expect(link.amount).toBe(amount);
      expect(link.accountNumber).toBe(accountNumber);
      expect(link.customerName).toBe(customerName);
      expect(link.bank).toBe('Access Bank');
      expect(link.status).toBe('active');
      expect(link.url).toMatch(/^https:\/\/nibss\.ng\/pay\/NIBSS-[A-Z0-9]+-[A-Z0-9]{6}$/);
      expect(link.reference).toMatch(/^NIBSS-[A-Z0-9]+-[A-Z0-9]{6}$/);
    });

    it('throws an error when amount is <= 0', () => {
      expect(() => {
        generatePaymentLink(0, '044', '1234567890', 'John Doe');
      }).toThrow('Amount must be greater than zero.');

      expect(() => {
        generatePaymentLink(-5000, '044', '1234567890', 'John Doe');
      }).toThrow('Amount must be greater than zero.');
    });

    it('throws an error when account number length is not exactly 10 digits', () => {
      expect(() => {
        generatePaymentLink(10000, '044', '123456789', 'John Doe');
      }).toThrow('Account number must be exactly 10 digits.');

      expect(() => {
        generatePaymentLink(10000, '044', '12345678901', 'John Doe');
      }).toThrow('Account number must be exactly 10 digits.');

      expect(() => {
        generatePaymentLink(10000, '044', 'abcdefghij', 'John Doe');
      }).toThrow('Account number must be exactly 10 digits.');
    });

    it('throws an error when the bank code is unknown', () => {
      expect(() => {
        generatePaymentLink(10000, 'Unknown Bank', '1234567890', 'John Doe');
      }).toThrow('Bank "Unknown Bank" not supported. Use getSupportedBanks() for available options.');
    });
  });
});
