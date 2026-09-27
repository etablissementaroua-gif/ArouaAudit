/**
 * Formats a monetary amount into standard Moroccan Dirham (MAD)
 */
export const formatMAD = (amount: number | null | undefined, includeSymbol: boolean = true): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? '0.00 MAD' : '0.00';
  }
  const formatted = new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `${formatted} MAD` : formatted;
};

export const parseMonetaryInput = (value: string): number => {
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
