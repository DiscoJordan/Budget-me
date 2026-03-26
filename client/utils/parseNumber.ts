/** Parse a user-entered number string, treating both ',' and '.' as decimal separator. */
export function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const cleaned = value.replace(",", ".");
  return parseFloat(cleaned) || 0;
}
