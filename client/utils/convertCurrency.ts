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
  return (amount / fromRate) * toRate;
}
