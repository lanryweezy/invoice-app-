import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, NrsApiError } from './apiConfig';

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
  });
});
