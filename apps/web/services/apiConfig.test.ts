import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, NrsApiError, getHeaders, setApiKey, setTin, setSandbox, getApiConfig } from './apiConfig';

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('apiConfig', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('setters and getters', () => {
    it('sets api key', () => {
      setApiKey('test-api-key');
      expect(getApiConfig().apiKey).toBe('test-api-key');
    });

    it('sets tin', () => {
      setTin('12345678');
      expect(getApiConfig().tin).toBe('12345678');
    });

    it('sets sandbox', () => {
      setSandbox(false);
      expect(getApiConfig().sandbox).toBe(false);
      expect(getApiConfig().baseUrl).toBe('https://api.nrs.gov.ng');

      setSandbox(true);
      expect(getApiConfig().sandbox).toBe(true);
      expect(getApiConfig().baseUrl).toBe('https://sandbox.nrs.gov.ng');
    });
  });

  describe('getHeaders', () => {
    it('returns default headers', () => {
      setApiKey('');
      setTin('');
      setSandbox(true);
      const headers = getHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ',
        'X-TIN': '',
        'X-Environment': 'sandbox',
      });
    });

    it('returns headers with updated config', () => {
      setApiKey('test-api-key');
      setTin('12345678');
      setSandbox(false);
      const headers = getHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key',
        'X-TIN': '12345678',
        'X-Environment': 'production',
      });
    });
  });

  describe('apiRequest', () => {
    it('returns parsed JSON data on a successful 200 response', async () => {
      const mockData = { success: true, data: 'test' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await apiRequest('/test-endpoint');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('maps an AbortError from a fetch timeout to a 408 NrsApiError', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      global.fetch = vi.fn().mockRejectedValue(abortError);

      try {
        await apiRequest('/timeout-endpoint');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NrsApiError);
        const apiError = error as NrsApiError;
        expect(apiError.statusCode).toBe(408);
        expect(apiError.message).toBe('Request timed out');
        expect(apiError.endpoint).toBe('/timeout-endpoint');
      }
    });

    it('throws NrsApiError with response message when response is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ message: 'Bad request data' }),
      });

      try {
        await apiRequest('/test-endpoint');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NrsApiError);
        const apiError = error as NrsApiError;
        expect(apiError.statusCode).toBe(400);
        expect(apiError.message).toBe('Bad request data');
      }
    });

    it('throws NrsApiError with default error message when response json fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      try {
        await apiRequest('/test-endpoint');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NrsApiError);
        const apiError = error as NrsApiError;
        expect(apiError.statusCode).toBe(500);
        expect(apiError.message).toBe('Request failed');
      }
    });

    it('maps an ordinary error to a NrsApiError with status 0', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      try {
        await apiRequest('/test-endpoint');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(NrsApiError);
        const apiError = error as NrsApiError;
        expect(apiError.statusCode).toBe(0);
        expect(apiError.message).toBe('Network failure');
      }
    });
  });
});
