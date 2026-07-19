const defaultCurrency = "PHP";

export function normalizeCurrency(
  currency: string | undefined,
  fallback = defaultCurrency
): string {
  return (
    currency?.trim().toUpperCase() ||
    fallback.trim().toUpperCase() ||
    defaultCurrency
  );
}

export function roundCurrencyAmount(
  amount: number
): number {
  return (
    Math.round(
      (
        amount +
        Number.EPSILON
      ) * 100
    ) /
    100
  );
}

export function normalizeExchangeRate(
  exchangeRate: number | undefined,
  fromCurrency: string,
  baseCurrency: string
): number {
  if (
    normalizeCurrency(fromCurrency) ===
    normalizeCurrency(baseCurrency)
  ) {
    return 1;
  }

  if (
    !Number.isFinite(
      exchangeRate
    ) ||
    (exchangeRate ?? 0) <= 0
  ) {
    return 0;
  }

  return roundExchangeRate(
    exchangeRate ?? 0
  );
}

export function convertEnteredAmount(
  enteredAmount: number,
  enteredCurrency: string,
  goalCurrency: string,
  baseCurrency: string,
  exchangeRate: number
) {
  const normalizedEnteredCurrency =
    normalizeCurrency(
      enteredCurrency,
      baseCurrency
    );

  const normalizedGoalCurrency =
    normalizeCurrency(
      goalCurrency,
      baseCurrency
    );

  const normalizedBaseCurrency =
    normalizeCurrency(baseCurrency);

  const roundedEnteredAmount =
    roundCurrencyAmount(
      enteredAmount
    );

  if (
    normalizedEnteredCurrency ===
      normalizedBaseCurrency &&
    normalizedGoalCurrency ===
      normalizedBaseCurrency
  ) {
    return {
      goalCurrencyAmount:
        roundedEnteredAmount,
      baseAmount:
        roundedEnteredAmount,
    };
  }

  if (
    normalizedEnteredCurrency ===
      normalizedGoalCurrency &&
    normalizedGoalCurrency !==
      normalizedBaseCurrency
  ) {
    return {
      goalCurrencyAmount:
        roundedEnteredAmount,
      baseAmount:
        roundCurrencyAmount(
          roundedEnteredAmount *
            exchangeRate
        ),
    };
  }

  if (
    normalizedEnteredCurrency !==
      normalizedBaseCurrency &&
    normalizedGoalCurrency ===
      normalizedBaseCurrency
  ) {
    const baseAmount =
      roundCurrencyAmount(
        roundedEnteredAmount *
          exchangeRate
      );

    return {
      goalCurrencyAmount:
        baseAmount,
      baseAmount,
    };
  }

  if (
    normalizedEnteredCurrency ===
      normalizedBaseCurrency &&
    normalizedGoalCurrency !==
      normalizedBaseCurrency
  ) {
    const goalCurrencyAmount =
      exchangeRate > 0
        ? roundCurrencyAmount(
            roundedEnteredAmount /
              exchangeRate
          )
        : 0;

    return {
      goalCurrencyAmount,
      baseAmount:
        roundedEnteredAmount,
    };
  }

  return {
    goalCurrencyAmount:
      roundedEnteredAmount,
    baseAmount:
      roundedEnteredAmount,
  };
}

export function roundExchangeRate(
  exchangeRate: number
): number {
  return (
    Math.round(
      (
        exchangeRate +
        Number.EPSILON
      ) * 1000000
    ) /
    1000000
  );
}
