export interface CountryDefaults {
  currency: string;
  timezone: string;
}

export const countryDefaults:
  Record<string, CountryDefaults> = {
    PH: {
      currency: "PHP",
      timezone: "Asia/Manila",
    },
    US: {
      currency: "USD",
      timezone: "America/New_York",
    },
    CA: {
      currency: "CAD",
      timezone: "America/Toronto",
    },
    AU: {
      currency: "AUD",
      timezone: "Australia/Sydney",
    },
    JP: {
      currency: "JPY",
      timezone: "Asia/Tokyo",
    },
    GB: {
      currency: "GBP",
      timezone: "Europe/London",
    },
    DE: {
      currency: "EUR",
      timezone: "Europe/Berlin",
    },
    SA: {
      currency: "SAR",
      timezone: "Asia/Riyadh",
    },
    QA: {
      currency: "QAR",
      timezone: "Asia/Qatar",
    },
  };

export function getCountryDefaults(
  country: string
): CountryDefaults | undefined {
  return countryDefaults[
    country.trim().toUpperCase()
  ];
}
