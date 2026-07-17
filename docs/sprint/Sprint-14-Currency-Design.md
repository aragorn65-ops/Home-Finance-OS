# Sprint 14 Currency Design Note

## Purpose

Sprint 14 starts the currency foundation for Home Finance OS.

The current product can assume a household has one local operating currency, chosen as the household base currency. Most household expenses, utilities, settlements, and dashboard summaries should continue to use that base currency.

Mixed-currency support is still needed for cases where money enters or is planned in another currency, especially income, accounts, and savings.

---

## Core Assumptions

* Household base currency represents the household's local reporting currency.
* Changing the base currency must not recompute historical records.
* Currency conversion should use the rate effective on the date the record is created or used.
* Historical records should preserve the exchange rate that was used at the time.
* Summary and analytics calculations should use stored base-currency amounts, not live recalculation.

---

## Primary Use Cases

### Local Household Operations

Most day-to-day records are expected to be in the household base currency:

* Groceries
* Utilities
* Rent
* Internet
* Settlements
* Shared household expenses

These can continue to behave as base-currency records unless the user explicitly selects another currency.

### Foreign Income or Remittance

A member may receive income, support, or remittance from abroad in a foreign currency.

Example:

```text
Household base currency: PHP
Income received: USD 200.00
Rate used: 1 USD = PHP 58.20
Base amount: PHP 11,640.00
```

The original amount should remain visible in details, while reports use the base-currency amount.

### Savings Contribution From Abroad

A savings contribution may be received in another currency and converted into the household base currency.

Example:

```text
Savings goal: Emergency Fund
Contribution entered: USD 100.00
Household base currency: PHP
Stored base amount: PHP 5,820.00
```

Savings activity should preserve the entered currency and amount, not only the converted amount.

### Foreign-Currency Savings Goal

A household may have a base currency of PHP but create a savings goal denominated in USD, such as a vacation, trip budget, tuition, or overseas purchase.

Example:

```text
Household base currency: PHP
Savings goal currency: USD
Goal target: USD 1,500.00
Reporting equivalent: PHP amount based on stored effective rates
```

The goal should display progress in the goal currency while still exposing a base-currency equivalent for dashboard and analytics reporting.

---

## Future Data Fields

These fields are design targets and should be introduced carefully when the model is updated.

### Household

```text
baseCurrency
```

### Account

```text
currency
baseCurrencyEquivalent
exchangeRateEffectiveDate
```

Accounts should eventually support a currency different from the household base currency.

### Transaction or Income

```text
enteredAmount
enteredCurrency
baseCurrency
baseAmount
exchangeRate
exchangeRateEffectiveDate
```

### Savings Goal

```text
targetAmount
goalCurrency
baseCurrency
targetBaseAmount
exchangeRate
exchangeRateEffectiveDate
```

### Savings Activity

```text
enteredAmount
enteredCurrency
goalCurrencyAmount
goalCurrency
baseCurrency
baseAmount
exchangeRate
exchangeRateEffectiveDate
```

---

## Calculation Rules

* Display details should show the original entered amount and currency when different from base currency.
* Dashboard and Analytics should use stored base-currency values.
* Savings goal progress should use the goal currency when the goal is foreign-currency denominated.
* Household-level net worth and account summaries should use base-currency equivalents.
* Historical exchange rates must not be overwritten by later rate changes.
* Changing household base currency is a forward-looking preference until a deliberate migration tool exists.

---

## Implementation Order

1. Keep the existing base currency selector as a display preference.
2. Add currency fields to Savings Goal first.
3. Add currency fields to Savings Activity next.
4. Add account currency support.
5. Add transaction and income entered-currency support.
6. Add API-backed exchange-rate lookup.
7. Update Analytics to report stored base-currency amounts while showing original-currency context where useful.

---

## Deferred

* Live exchange-rate API integration.
* Historical rate migration.
* Automatic revaluation of old records.
* Multi-currency account reconciliation.
* User-defined manual exchange-rate corrections.
