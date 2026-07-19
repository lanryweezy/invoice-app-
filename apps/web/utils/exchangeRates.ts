import { trackEvent } from './analytics';

const CACHE_KEY = 'invoiceapp_exchange_rates';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
  NGN: number;
  lastUpdated: string;
}

const FALLBACK_RATES: ExchangeRates = {
  USD: 1550,
  EUR: 1680,
  GBP: 1950,
  NGN: 1,
  lastUpdated: new Date().toISOString(),
};

export async function getExchangeRates(): Promise<ExchangeRates> {
  const cached = getCachedRates();
  if (cached) return cached;

  // Protect against indefinite hangs on external API calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/NGN', {
      signal: controller.signal
    });
    if (!res.ok) throw new Error('Failed to fetch rates');
    const data = await res.json();

    const rates: ExchangeRates = {
      USD: data.rates?.USD ? Math.round(1 / data.rates.USD) : FALLBACK_RATES.USD,
      EUR: data.rates?.EUR ? Math.round(1 / data.rates.EUR) : FALLBACK_RATES.EUR,
      GBP: data.rates?.GBP ? Math.round(1 / data.rates.GBP) : FALLBACK_RATES.GBP,
      NGN: 1,
      lastUpdated: new Date().toISOString(),
    };

    cacheRates(rates);
    return rates;
  } catch (error) {
    console.warn('Exchange rates fetch failed or timed out. Using fallback rates.', error);
    try { trackEvent('exchange_rates_fetch_failed', { error: String(error) }); } catch {}
    return FALLBACK_RATES;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function convertCurrency(amount: number, from: string, to: string, rates: ExchangeRates): number {
  if (from === to) return amount;
  const inNGN = from === 'NGN' ? amount : amount * ((rates[from as keyof ExchangeRates] as number) || 1);
  return to === 'NGN' ? inNGN : Math.round(inNGN / ((rates[to as keyof ExchangeRates] as number) || 1));
}

function getCachedRates(): ExchangeRates | null {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (Date.now() - new Date(data.lastUpdated).getTime() > CACHE_DURATION) return null;
    return data;
  } catch {
    return null;
  }
}

function cacheRates(rates: ExchangeRates): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
  } catch {}
}
