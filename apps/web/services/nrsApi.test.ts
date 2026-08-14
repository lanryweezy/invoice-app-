import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateTIN,
  submitInvoice,
  checkInvoiceStatus,
  generateQRCode,
  reportVAT,
  reportWHT
} from './nrsApi';
import * as apiConfig from './apiConfig';
import * as analytics from '../utils/analytics';

vi.mock('./apiConfig', () => ({
  apiRequest: vi.fn(),
  getApiConfig: vi.fn(),
}));

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn()
}));

describe('nrsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('validateTIN', () => {
    it('returns valid true when API succeeds', async () => {
      vi.mocked(apiConfig.apiRequest).mockResolvedValue({
        valid: true,
        business_name: 'Test Business',
        status: 'active',
        message: 'Success'
      });

      const result = await validateTIN('12345678');
      expect(result.valid).toBe(true);
      expect(result.businessName).toBe('Test Business');
      expect(apiConfig.apiRequest).toHaveBeenCalledWith('/v1/tin/validate', 'POST', { tin: '12345678' });
    });

    it('returns valid false when API fails', async () => {
      vi.mocked(apiConfig.apiRequest).mockRejectedValue(new Error('Network error'));

      const result = await validateTIN('12345678');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Validation failed. Please try again.');
    });
  });

  describe('submitInvoice', () => {
    it('returns success true when API succeeds', async () => {
      vi.mocked(apiConfig.apiRequest).mockResolvedValue({
        invoice_id: 'nrs-123',
        status: 'accepted',
        message: 'Invoice submitted'
      });

      const invoice = { invoiceNumber: 'INV-1', invoiceDate: '2023-01-01', dueDate: '2023-01-31', businessTIN: '123', lineItems: [], subtotal: 100, vat: 7.5, total: 107.5 };
      const result = await submitInvoice(invoice);

      expect(result.success).toBe(true);
      expect(result.nrsInvoiceId).toBe('nrs-123');
    });

    it('returns success false when API fails', async () => {
      vi.mocked(apiConfig.apiRequest).mockRejectedValue(new Error('API error'));

      const invoice = { invoiceNumber: 'INV-1', invoiceDate: '2023-01-01', dueDate: '2023-01-31', businessTIN: '123', lineItems: [], subtotal: 100, vat: 7.5, total: 107.5 };
      const result = await submitInvoice(invoice);

      expect(result.success).toBe(false);
      expect(result.message).toBe('API error');
    });
  });

  describe('checkInvoiceStatus', () => {
    it('returns status from API', async () => {
      vi.mocked(apiConfig.apiRequest).mockResolvedValue({ status: 'cleared' });
      const result = await checkInvoiceStatus('nrs-123');
      expect(result.status).toBe('cleared');
      expect(apiConfig.apiRequest).toHaveBeenCalledWith('/v1/e-invoice/status/nrs-123');
    });

    it('returns unknown when API fails', async () => {
      vi.mocked(apiConfig.apiRequest).mockRejectedValue(new Error('API error'));
      const result = await checkInvoiceStatus('nrs-123');
      expect(result.status).toBe('unknown');
    });
  });

  describe('generateQRCode', () => {
    it('returns URLs when API succeeds', async () => {
      vi.mocked(apiConfig.apiRequest).mockResolvedValue({
        qr_code_url: 'https://example.com/qr',
        verification_url: 'https://example.com/verify'
      });

      const result = await generateQRCode('inv-123');
      expect(result.qrCodeUrl).toBe('https://example.com/qr');
      expect(result.verificationUrl).toBe('https://example.com/verify');
    });

    it('returns empty strings when API fails', async () => {
      vi.mocked(apiConfig.apiRequest).mockRejectedValue(new Error('API error'));

      const result = await generateQRCode('inv-123');
      expect(result.qrCodeUrl).toBe('');
      expect(result.verificationUrl).toBe('');
    });
  });

  describe('reportVAT', () => {
    it('calls API correctly', async () => {
      vi.mocked(apiConfig.apiRequest).mockResolvedValue({ success: true });
      const data = { period: '2023-01', totalSales: 100, totalVAT: 7.5, tin: '123' };
      const result = await reportVAT(data);
      expect(result.success).toBe(true);
      expect(apiConfig.apiRequest).toHaveBeenCalledWith('/v1/vat/report', 'POST', data);
    });

    it('throws when API fails and logs error', async () => {
      vi.mocked(apiConfig.apiRequest).mockRejectedValue(new Error('API error'));
      const consoleSpy = vi.spyOn(console, 'error');

      const data = { period: '2023-01', totalSales: 100, totalVAT: 7.5, tin: '123' };
      await expect(reportVAT(data)).rejects.toThrow('API error');

      expect(consoleSpy).toHaveBeenCalledWith('VAT report failed:', {
        event: 'nrs.vat.report.failed',
        period: '2023-01',
        error: 'API error'
      });
      expect(analytics.trackEvent).toHaveBeenCalledWith('nrs_vat_report_failed', {
        period: '2023-01',
        error: 'API error'
      });
    });
  });

  describe('reportWHT', () => {
    it('calls API correctly', async () => {
      vi.mocked(apiConfig.apiRequest).mockResolvedValue({ success: true });
      const data = { period: '2023-01', totalWHT: 5, tin: '123' };
      const result = await reportWHT(data);
      expect(result.success).toBe(true);
      expect(apiConfig.apiRequest).toHaveBeenCalledWith('/v1/wht/report', 'POST', data);
    });

    it('throws when API fails and logs error', async () => {
      vi.mocked(apiConfig.apiRequest).mockRejectedValue(new Error('API error'));
      const consoleSpy = vi.spyOn(console, 'error');

      const data = { period: '2023-01', totalWHT: 5, tin: '123' };
      await expect(reportWHT(data)).rejects.toThrow('API error');

      expect(consoleSpy).toHaveBeenCalledWith('WHT report failed:', {
        event: 'nrs.wht.report.failed',
        period: '2023-01',
        error: 'API error'
      });
      expect(analytics.trackEvent).toHaveBeenCalledWith('nrs_wht_report_failed', {
        period: '2023-01',
        error: 'API error'
      });
    });
  });
});
