import {
  useState,
} from "react";

import {
  currencyRateProvider,
  type CurrencyRate,
} from "../services/CurrencyRateProvider";
import {
  normalizeCurrency,
} from "../utils/currencyConversion";

interface CurrencyRateLookupButtonProps {
  fromCurrency: string;
  toCurrency: string;
  effectiveDate: string;
  disabled?: boolean;

  onRateSelected: (
    rate: CurrencyRate
  ) => void;
}

export default function CurrencyRateLookupButton({
  fromCurrency,
  toCurrency,
  effectiveDate,
  disabled = false,
  onRateSelected,
}: CurrencyRateLookupButtonProps) {
  const [isLoading, setIsLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const normalizedFromCurrency =
    normalizeCurrency(fromCurrency);

  const normalizedToCurrency =
    normalizeCurrency(toCurrency);

  const canFetch =
    !disabled &&
    normalizedFromCurrency !==
      normalizedToCurrency &&
    Boolean(effectiveDate);

  const handleClick = async () => {
    if (!canFetch) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const rate =
        await currencyRateProvider.getRate({
          fromCurrency:
            normalizedFromCurrency,
          toCurrency:
            normalizedToCurrency,
          effectiveDate,
        });

      onRateSelected(rate);

      setMessage(
        `${rate.providerName ?? "Provider"} rate applied for ${rate.effectiveDate}.`
      );
    }
    catch (error) {
      setMessage(
        error instanceof Error
          ? `${error.message} Enter the rate manually.`
          : "Rate lookup unavailable. Enter the rate manually."
      );
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={
          !canFetch ||
          isLoading
        }
        onClick={handleClick}
        className="rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? "Checking rate..."
          : "Use suggested rate"}
      </button>

      {message && (
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
