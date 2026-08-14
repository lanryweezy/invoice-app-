import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getExchangeRates, convertCurrency } from './exchangeRates';
import { trackEvent } from './analytics';

vi.mock('./analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('exchangeRates', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn()
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('getExchangeRates', () => {
    it('returns cached rates if they are valid', async () => {
      const mockRates = {
        USD: 1000,
        EUR: 1100,
        GBP: 1200,
        NGN: 1,
        lastUpdated: new Date('2024-01-01T11:30:00Z').toISOString() // Within 1 hour
      };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockRates));

      const rates = await getExchangeRates();

      expect(rates).toEqual(mockRates);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('fetches new rates if cache is expired', async () => {
      const oldRates = {
        USD: 1000,
        EUR: 1100,
        GBP: 1200,
        NGN: 1,
        lastUpdated: new Date('2024-01-01T10:30:00Z').toISOString() // More than 1 hour old
      };
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(oldRates));

      const apiRates = { rates: { USD: 0.001, EUR: 0.0009, GBP: 0.0008 } };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => apiRates
      } as Response);

      const rates = await getExchangeRates();

      expect(fetch).toHaveBeenCalled();
      expect(rates.USD).toBe(1000); // Math.round(1 / 0.001)
      expect(localStorage.setItem).toHaveBeenCalledWith('invoiceapp_exchange_rates', expect.any(String));
    });

    it('fetches new rates if cache is missing', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      const apiRates = { rates: { USD: 0.001, EUR: 0.0009, GBP: 0.0008 } };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => apiRates
      } as Response);

      const rates = await getExchangeRates();
      expect(fetch).toHaveBeenCalled();
      expect(rates.USD).toBe(1000);
    });

    it('returns fallback rates if fetch fails', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const rates = await getExchangeRates();

      expect(rates.USD).toBe(1550); // Fallback value
      expect(rates.NGN).toBe(1);
    });

    it('returns fallback rates if response is not ok', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(fetch).mockResolvedValue({
        ok: false
      } as Response);

      const rates = await getExchangeRates();

      expect(rates.USD).toBe(1550);
    });

    it('returns fallback values for missing currencies in API response', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      const apiRates = { rates: {} }; // USD, EUR and GBP missing
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => apiRates
      } as Response);

      const rates = await getExchangeRates();

      expect(rates.USD).toBe(1550); // Fallback
      expect(rates.EUR).toBe(1680); // Fallback
      expect(rates.GBP).toBe(1950); // Fallback
    });

    it('aborts fetch and returns fallback rates on timeout', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      // We simulate a fetch that listens to the abort signal and throws an error like fetch does
      vi.mocked(fetch).mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              reject(new Error('AbortError'));
            });
          }
        });
      });

      // Start the fetch process
      const ratesPromise = getExchangeRates();

      // Fast-forward to trigger the setTimeout callback in getExchangeRates
      await vi.runAllTimersAsync();

      // Wait for our fetch mock's rejection to propagate and the fallback to be returned
      const rates = await ratesPromise;

      expect(rates.USD).toBe(1550);
      expect(rates.NGN).toBe(1);

      // Ensure fetch was called with a signal
      expect(fetch).toHaveBeenCalledWith('https://api.exchangerate-api.com/v4/latest/NGN', expect.objectContaining({
        signal: expect.any(AbortSignal)
      }));
    });

    it('handles localStorage errors gracefully during read', async () => {
      vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error('Access denied'); });
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const rates = await getExchangeRates();
      expect(rates.USD).toBe(1550);
    });

    it('handles invalid JSON in localStorage gracefully', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const rates = await getExchangeRates();
      expect(rates.USD).toBe(1550);
    });

    it('handles localStorage errors gracefully during cache write', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error('Quota exceeded'); });

      const apiRates = { rates: { USD: 0.001 } };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => apiRates
      } as Response);

      const rates = await getExchangeRates();
      expect(rates.USD).toBe(1000); // Write failed but rates still returned
    });

    it('handles trackEvent exception during fetch error handling gracefully', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
      vi.mocked(trackEvent).mockImplementation(() => { throw new Error('Analytics failed'); });

      const rates = await getExchangeRates();

      expect(rates.USD).toBe(1550); // Should still return fallbacks without throwing
      expect(trackEvent).toHaveBeenCalled();
    });
  });

  describe('convertCurrency', () => {
    const mockRates = {
      USD: 1000,
      EUR: 1200,
      GBP: 1500,
      NGN: 1,
      lastUpdated: '2024-01-01'
    };

    it('returns the same amount if from and to are identical', () => {
      expect(convertCurrency(500, 'USD', 'USD', mockRates)).toBe(500);
      expect(convertCurrency(500, 'NGN', 'NGN', mockRates)).toBe(500);
    });

    it('converts NGN to another currency', () => {
      // 10000 NGN -> USD (rate is 1000 NGN/USD) = 10 USD
      expect(convertCurrency(10000, 'NGN', 'USD', mockRates)).toBe(10);
    });

    it('converts another currency to NGN', () => {
      // 10 USD -> NGN (rate is 1000 NGN/USD) = 10000 NGN
      expect(convertCurrency(10, 'USD', 'NGN', mockRates)).toBe(10000);
    });

    it('converts between two non-NGN currencies', () => {
      // 10 USD -> NGN = 10000 NGN
      // 10000 NGN -> EUR = 10000 / 1200 ≈ 8.33 => 8
      expect(convertCurrency(10, 'USD', 'EUR', mockRates)).toBe(8);
    });

    it('uses 1 as fallback for unknown currencies', () => {
      // 10000 NGN -> JPY (unknown)
      expect(convertCurrency(10000, 'NGN', 'JPY', mockRates)).toBe(10000);

      // 10 JPY -> NGN (unknown)
      expect(convertCurrency(10, 'JPY', 'NGN', mockRates)).toBe(10);
    });
  });
});
