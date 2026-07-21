/**
 * 🏗️ Mason: Extracted shared formatter to avoid repeated instantiation
 * and centralize formatting logic.
 */
export const numberFormatter = new Intl.NumberFormat();

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export const getCurrencyFormatter = (currency: string, locale: string = 'en-US') => {
  const key = `${locale}-${currency}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(key, new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }));
  }
  return currencyFormatters.get(key)!;
};

export const formatCurrency = (amount: number, currency: string, locale: string = 'en-US') => {
  return getCurrencyFormatter(currency, locale).format(amount);
};
