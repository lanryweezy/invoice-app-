import { describe, it, expect } from 'vitest';
import {
  getBankDetails,
  getSupportedBanks,
  generatePaymentLink,
  generateBankTransferDetails,
  verifyPayment,
  getPaymentStatus,
  generateReceipt,
  generateReceiptHTML,
  getFormattedBankDetails,
  isPaymentExpired,
  cancelPaymentLink,
} from './nibssIntegration';
import { vi, afterEach, beforeEach } from 'vitest';

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

  describe('verifyPayment', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns a failed status when the transaction is not found', () => {
      const status = verifyPayment('NON-EXISTENT-REF');
      expect(status.status).toBe('failed');
      expect(status.message).toBe('Transaction not found in NIBSS system');
    });

    it('returns the status for an existing payment link', () => {
      const link = generatePaymentLink(5000, '044', '1234567890', 'John Doe');
      const status = verifyPayment(link.reference);
      expect(status.status).toBe('pending');
      expect(status.reference).toBe(link.reference);
    });

    it('marks the payment as expired if the link has expired', () => {
      const link = generatePaymentLink(5000, '044', '1234567890', 'John Doe');
      vi.advanceTimersByTime(25 * 60 * 60 * 1000); // advance 25 hours
      const status = verifyPayment(link.reference);
      expect(status.status).toBe('expired');
      expect(status.message).toBe('Payment link has expired');
    });
  });

  describe('getPaymentStatus', () => {
    it('returns undefined when invoiceId does not match any reference', () => {
      expect(getPaymentStatus('UNKNOWN-INVOICE')).toBeUndefined();
    });

    it('returns status by invoice ID via payment statuses', () => {
      const details = generateBankTransferDetails(1000, '044', '1234567890', 'Test');
      const status = getPaymentStatus(details.reference);
      expect(status).toBeDefined();
      expect(status?.reference).toBe(details.reference);
    });

    it('returns status by invoice ID via payment links', () => {
      const link = generatePaymentLink(2000, '044', '1234567890', 'Test');
      const status = getPaymentStatus(link.reference);
      expect(status).toBeDefined();
      expect(status?.reference).toBe(link.reference);
    });
  });

  describe('generateReceipt', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('generates a valid receipt from payment details', () => {
      const receipt = generateReceipt({
        invoiceNumber: 'INV-001',
        payer: 'Alice',
        payee: 'Bob',
        amount: 500,
        bank: 'Access Bank',
        reference: 'REF-123'
      });

      expect(receipt.invoiceNumber).toBe('INV-001');
      expect(receipt.amount).toBe(500);
      expect(receipt.receiptNumber).toMatch(/^RCP-NIBSS-/);
      expect(receipt.paidAt).toBe(new Date().toISOString());
    });
  });

  describe('generateReceiptHTML', () => {
    it('generates an HTML string containing receipt data', () => {
      const receipt = generateReceipt({
        invoiceNumber: 'INV-002',
        payer: 'Charlie',
        payee: 'Dave',
        amount: 1500,
        bank: 'GTB',
        reference: 'REF-456'
      });

      const html = generateReceiptHTML(receipt);
      expect(html).toContain('INV-002');
      expect(html).toContain('Charlie');
      expect(html).toContain('REF-456');
      expect(html).toContain('NIBSS Electronic Payment Confirmation');
    });
  });

  describe('getFormattedBankDetails', () => {
    it('returns formatted details for a supported bank', () => {
      const formatted = getFormattedBankDetails('044', '1234567890');
      expect(formatted).toContain('Bank: Access Bank');
      expect(formatted).toContain('Account Number: 1234567890');
      expect(formatted).toContain('Bank Code: 044');
    });

    it('returns "Bank not found" for an unsupported bank', () => {
      const formatted = getFormattedBankDetails('Unknown', '1234567890');
      expect(formatted).toBe('Bank not found');
    });
  });

  describe('isPaymentExpired', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true if the reference is not found', () => {
      expect(isPaymentExpired('NOT-FOUND')).toBe(true);
    });

    it('returns false for an active payment link', () => {
      const link = generatePaymentLink(5000, '044', '1234567890', 'John Doe');
      expect(isPaymentExpired(link.reference)).toBe(false);
    });

    it('returns true if the payment link has expired', () => {
      const link = generatePaymentLink(5000, '044', '1234567890', 'John Doe');
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);
      expect(isPaymentExpired(link.reference)).toBe(true);
    });
  });

  describe('cancelPaymentLink', () => {
    it('returns false when trying to cancel an unknown reference', () => {
      expect(cancelPaymentLink('NOT-FOUND')).toBe(false);
    });

    it('cancels an active payment link and updates status', () => {
      const link = generatePaymentLink(5000, '044', '1234567890', 'John Doe');
      const success = cancelPaymentLink(link.reference);

      expect(success).toBe(true);

      const status = verifyPayment(link.reference);
      expect(status.status).toBe('expired');
      expect(status.message).toBe('Payment cancelled by merchant');
    });
  });
});
