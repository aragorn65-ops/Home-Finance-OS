import {
  normalizeCurrency,
  roundExchangeRate,
} from "../utils/currencyConversion";

export type ExchangeRateSource =
  | "manual"
  | "api";

export interface CurrencyRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  effectiveDate: string;
  source: ExchangeRateSource;
  providerName?: string;
}

export interface CurrencyRateProvider {
  readonly name: string;

  getRate(
    request: CurrencyRateRequest
  ): Promise<CurrencyRate>;
}

export interface CurrencyRateRequest {
  fromCurrency: string;
  toCurrency: string;
  effectiveDate: string;
}

interface FrankfurterResponse {
  base?: string;
  quote?: string;
  date?: string;
  rate?: number;
}

class FrankfurterRateProvider
  implements CurrencyRateProvider
{
  readonly name = "Frankfurter";

  async getRate(
    request: CurrencyRateRequest
  ): Promise<CurrencyRate> {
    const fromCurrency =
      normalizeCurrency(
        request.fromCurrency
      );

    const toCurrency =
      normalizeCurrency(
        request.toCurrency
      );

    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        rate: 1,
        effectiveDate:
          request.effectiveDate,
        source: "api",
        providerName:
          this.name,
      };
    }

    const url =
      `https://api.frankfurter.dev/v2/rate/` +
      `${encodeURIComponent(fromCurrency)}/` +
      `${encodeURIComponent(toCurrency)}` +
      `?date=${encodeURIComponent(request.effectiveDate)}`;

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        "The currency-rate provider did not return a rate."
      );
    }

    const payload =
      (await response.json()) as FrankfurterResponse;

    const rate =
      payload.rate;

    if (
      !Number.isFinite(rate) ||
      (rate ?? 0) <= 0
    ) {
      throw new Error(
        "The currency-rate provider response was missing the requested rate."
      );
    }

    return {
      fromCurrency,
      toCurrency,
      rate: roundExchangeRate(
        rate ?? 0
      ),
      effectiveDate:
        payload.date ??
        request.effectiveDate,
      source: "api",
      providerName:
        this.name,
    };
  }
}

export const currencyRateProvider:
  CurrencyRateProvider =
  new FrankfurterRateProvider();
