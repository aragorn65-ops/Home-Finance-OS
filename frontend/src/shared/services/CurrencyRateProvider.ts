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

interface ExchangeApiResponse {
  date?: string;
  [currency: string]:
    | string
    | Record<string, number>
    | undefined;
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

class ExchangeApiRateProvider
  implements CurrencyRateProvider
{
  readonly name = "Currency API";

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

    const fromCurrencyKey =
      fromCurrency.toLowerCase();

    const toCurrencyKey =
      toCurrency.toLowerCase();

    const effectiveDate =
      request.effectiveDate ||
      "latest";

    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${encodeURIComponent(effectiveDate)}/v1/currencies/${encodeURIComponent(fromCurrencyKey)}.json`,
      `https://${encodeURIComponent(effectiveDate)}.currency-api.pages.dev/v1/currencies/${encodeURIComponent(fromCurrencyKey)}.json`,
    ];

    let lastError:
      Error | undefined;

    for (const url of urls) {
      try {
        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            "The fallback currency-rate provider did not return a rate."
          );
        }

        const payload =
          (await response.json()) as ExchangeApiResponse;

        const rates =
          payload[fromCurrencyKey];

        const rate =
          typeof rates === "object"
            ? rates?.[toCurrencyKey]
            : undefined;

        if (
          !Number.isFinite(rate) ||
          (rate ?? 0) <= 0
        ) {
          throw new Error(
            "The fallback currency-rate provider response was missing the requested rate."
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
      catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error(
                "Fallback currency lookup failed."
              );
      }
    }

    throw (
      lastError ??
      new Error(
        "Fallback currency lookup failed."
      )
    );
  }
}

class ResilientCurrencyRateProvider
  implements CurrencyRateProvider
{
  readonly name =
    "Frankfurter + Currency API";

  private readonly providers:
    CurrencyRateProvider[] = [
      new FrankfurterRateProvider(),
      new ExchangeApiRateProvider(),
    ];

  async getRate(
    request: CurrencyRateRequest
  ): Promise<CurrencyRate> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      try {
        return await provider.getRate(
          request
        );
      }
      catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : `${provider.name} lookup failed.`
        );
      }
    }

    throw new Error(
      errors.at(-1) ??
        "Rate lookup unavailable."
    );
  }
}

export const currencyRateProvider:
  CurrencyRateProvider =
  new ResilientCurrencyRateProvider();
