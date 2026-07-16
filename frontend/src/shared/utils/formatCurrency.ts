export interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const DEFAULT_CURRENCY = "PHP";

export default function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options: CurrencyFormatOptions = {}
): string {
  const normalizedCurrency =
    currency.trim().toUpperCase() ||
    DEFAULT_CURRENCY;

  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency:
          normalizedCurrency,
        minimumFractionDigits,
        maximumFractionDigits,
      }
    ).format(amount);
  }
  catch {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency:
          DEFAULT_CURRENCY,
        minimumFractionDigits,
        maximumFractionDigits,
      }
    ).format(amount);
  }
}
