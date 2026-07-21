import { describe, it, expect } from 'vitest';
import {
  getBankDetails,
  getSupportedBanks,
  generatePaymentLink,
  generateBankTransferDetails,
} from './nibssIntegration';

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
    it('generates a valid payment link when inputs are valid', () => {
      const link = generatePaymentLink(5000, '044', '1234567890', 'John Doe');
      expect(link.amount).toBe(5000);
      expect(link.bank).toBe('Access Bank');
      expect(link.accountNumber).toBe('1234567890');
      expect(link.customerName).toBe('John Doe');
      expect(link.url).toContain('https://nibss.ng/pay/NIBSS-');
      expect(link.status).toBe('active');
    });

    it('throws an error when an unsupported bank is provided', () => {
      expect(() => {
        generatePaymentLink(5000, 'Unknown Bank', '1234567890', 'John Doe');
      }).toThrow('Bank "Unknown Bank" not supported. Use getSupportedBanks() for available options.');
    });

    it('throws an error when the account number is not exactly 10 digits', () => {
      expect(() => {
        generatePaymentLink(5000, '044', '12345', 'John Doe');
      }).toThrow('Account number must be exactly 10 digits.');

      expect(() => {
        generatePaymentLink(5000, '044', 'abcdefghij', 'John Doe');
      }).toThrow('Account number must be exactly 10 digits.');
    });

    it('throws an error when the amount is not greater than zero', () => {
      expect(() => {
        generatePaymentLink(0, '044', '1234567890', 'John Doe');
      }).toThrow('Amount must be greater than zero.');

      expect(() => {
        generatePaymentLink(-500, '044', '1234567890', 'John Doe');
      }).toThrow('Amount must be greater than zero.');
    });
  });

  describe('generateBankTransferDetails', () => {
    it('returns valid bank transfer details when inputs are valid', () => {
      const details = generateBankTransferDetails(15000, 'gtbank', '0987654321', 'Jane Smith', 'Invoice #102 Payment');
      expect(details.bankName).toBe('Guaranty Trust Bank');
      expect(details.bankCode).toBe('057');
      expect(details.accountNumber).toBe('0987654321');
      expect(details.beneficiaryName).toBe('Jane Smith');
      expect(details.narration).toBe('Invoice #102 Payment');
      expect(details.amount).toBe(15000);
      expect(details.reference).toContain('NIBSS-');
    });

    it('uses a default narration if none is provided', () => {
      const details = generateBankTransferDetails(15000, 'gtbank', '0987654321', 'Jane Smith');
      expect(details.narration).toContain('Payment for invoice - NIBSS-');
    });

    it('throws an error when an unsupported bank is provided', () => {
      expect(() => {
        generateBankTransferDetails(15000, 'FakeBank', '0987654321', 'Jane Smith');
      }).toThrow('Bank "FakeBank" not supported.');
    });
  });
});
