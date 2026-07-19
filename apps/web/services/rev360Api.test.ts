import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Rev360Api, rev360Api } from './rev360Api';
import { trackEvent } from '../utils/analytics';

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('Rev360Api', () => {
  let api: Rev360Api;

  beforeEach(() => {
    api = new Rev360Api();
    global.fetch = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('authenticates successfully', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ access_token: 'test_token', expires_in: 3600 })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await api.authenticate({
      clientId: 'id',
      clientSecret: 'secret',
      tin: '123'
    });

    expect(result).toEqual({ success: true, accessToken: 'test_token', expiresIn: 3600 });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://rev360.nrs.gov.ng/api/auth/token',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('handles authentication failure gracefully', async () => {
    const mockResponse = {
      ok: false,
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await api.authenticate({
      clientId: 'id',
      clientSecret: 'secret',
      tin: '123'
    });

    expect(result).toEqual({ success: false, message: 'Authentication failed' });
  });

  it('handles fetch timeout explicitly mapping AbortError', async () => {
    const timeoutError = new Error('The operation was aborted');
    timeoutError.name = 'AbortError';
    (global.fetch as any).mockRejectedValue(timeoutError);

    await expect(api.authenticate({
        clientId: 'id',
        clientSecret: 'secret',
        tin: '123'
    })).resolves.toEqual({ success: false, message: 'The operation was aborted' });

    expect(trackEvent).toHaveBeenCalledWith('rev360_api_call', expect.objectContaining({
        status: 408
    }));
  });

  it('registers an invoice', async () => {
    const mockResponse = {
      json: async () => ({ success: true, invoiceId: 'inv_123' })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Auth to get token for headers
    const authResponse = { ok: true, json: async () => ({ access_token: 'tok' }) };
    (global.fetch as any).mockResolvedValueOnce(authResponse);
    await api.authenticate({ clientId: '', clientSecret: '', tin: '' });

    const result = await api.registerInvoice({ amount: 100 });
    expect(result).toEqual({ success: true, invoiceId: 'inv_123' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://rev360.nrs.gov.ng/api/invoices/register',
      expect.objectContaining({
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer tok' }
      })
    );
  });

  it('files VAT return', async () => {
    const mockResponse = {
      json: async () => ({ success: true })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await api.fileVATReturn({ period: 'Q1', totalSales: 0, totalPurchases: 0, outputVAT: 0, inputVAT: 0, netVAT: 0 });
    expect(result).toEqual({ success: true });
  });

  it('generates WHT certificate', async () => {
     const mockResponse = {
      json: async () => ({ success: true })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await api.generateWHTCertificate({ invoiceId: '123' });
    expect(result).toEqual({ success: true });
  });

  it('checks compliance', async () => {
     const mockResponse = {
      json: async () => ({ status: 'compliant' })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await api.checkCompliance('123456');
    expect(result).toEqual({ status: 'compliant' });
  });

  it('handles general errors smoothly', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network offline'));
      const result = await api.checkCompliance('123');
      expect(result).toEqual({ status: 'unknown', message: 'Compliance check failed' });
  });

  it('handles errors for registerInvoice', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      const result = await api.registerInvoice({});
      expect(result).toEqual({ success: false, message: 'Network error' });
  });

  it('handles errors for fileVATReturn', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      const result = await api.fileVATReturn({} as any);
      expect(result).toEqual({ success: false, message: 'Network error' });
  });

  it('handles errors for generateWHTCertificate', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      const result = await api.generateWHTCertificate({});
      expect(result).toEqual({ success: false, message: 'Network error' });
  });
});
