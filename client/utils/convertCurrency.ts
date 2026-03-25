/**
 * Converts an amount from one currency to the main currency using USD-based rates.
 * Falls back to the original amount if rates are unavailable.
 */
export function toMainCurrency(
  amount: number,
  fromCurrency: string,
  rates: Record<string, number>,
  mainCurrency: string
): number {
  if (fromCurrency === mainCurrency) return amount;
  const fromRate = rates[fromCurrency];
  const toRate = rates[mainCurrency];
  if (!fromRate || !toRate) return amount;
  return Math.round((amount / fromRate) * toRate * 100) / 100;
}

/**
 * Converts an amount from one currency to another using USD-based rates.
 * Falls back to the original amount if rates are unavailable.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  if (!fromRate || !toRate) return amount;
  return Math.round((amount / fromRate) * toRate * 100) / 100;
}
