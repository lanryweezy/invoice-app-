import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, NrsApiError, getHeaders, setApiKey, setTin, setSandbox } from './apiConfig';

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

    it('throws NrsApiError with fallback message when response is not ok and JSON parsing fails', async () => {
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
  });
});
