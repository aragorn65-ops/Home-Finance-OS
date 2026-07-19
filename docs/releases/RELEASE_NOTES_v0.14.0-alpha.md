# Home Finance OS v0.14.0-alpha

## Analytics and Household Preferences

**Release Date:** July 18, 2026
**Status:** Alpha Release
**Sprint:** Sprint 14

---

## Overview

Home Finance OS v0.14.0-alpha introduces the first read-only Analytics section and expands household-level preferences.

This release builds on Sprint 13's month-aware behavior by keeping analytics, settlements, savings, transactions, utilities, and account reporting aligned to the selected reporting month and household base currency rules.

---

## Highlights

* Added the Analytics route and sidebar navigation entry.
* Added monthly income, expense, and net cash-flow analytics.
* Added top expense category analytics.
* Added six-month income versus expense trend analytics.
* Added utility cost analytics for electricity, water, and internet.
* Added settlement status analytics based on the original transaction month.
* Added savings contribution and goal-progress analytics.
* Added account position analytics for assets, liabilities, and net worth.
* Added Settings controls for System Default, Light, and Dark themes.
* Added Settings controls for household base currency.
* Added currency design rules for record-date exchange rates and no historical recomputation.
* Added mixed-currency support groundwork for income transactions, accounts, and savings.
* Added centered validation summary popups for major data-entry workflows.
* Improved dark-theme readability across Settings, Transactions, Utilities, Settlements, Household Members, and shared UI surfaces.
* Refined dashboard activity icon colors and payment status badge colors for clearer visual hierarchy.

---

## Currency Rules

* Household reporting uses the configured base currency.
* Foreign-currency records preserve the entered currency, entered amount, exchange rate, rate effective date, and base-currency equivalent.
* Historical records are not recomputed when the household base currency or future exchange rates change.
* Savings goals may use a currency different from the household base currency.
* Foreign-currency savings activity can contribute to a goal while still reporting a base-currency equivalent.
* Live API currency conversion remains deferred.

---

## Data Compatibility Notes

* Existing localStorage records are hydrated with safe currency fallbacks where older records do not yet have currency fields.
* Older accounts default to PHP reporting currency and exchange rate `1` unless edited with explicit currency details.
* Older income transactions default to the household/base currency when entered-currency fields are missing.
* Older savings goals and savings activity records default missing currency metadata from their existing amount fields.
* Compatibility hydration does not rewrite or recompute historical records unless the user edits or saves the record.

---

## Verification

Current verification passed:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Known non-blocking warning:

* The main Vite JavaScript bundle may remain above the default size warning threshold.
* Git may report existing LF-to-CRLF working-copy warnings on Windows.

---

## Manual QA Focus

Before finalizing this alpha, manually verify:

* Month isolation across Dashboard, Analytics, Transactions, Utilities, Settlements, and Recent Activity.
* Mixed-currency income, accounts, and savings reporting.
* Account balance reversal after deleting linked income or savings records.
* Settlement status and analytics by original transaction month.
* Receipt upload behavior for supported image and PDF files.
* Validation popups for blocked Save and Update actions.
* Light and dark theme readability across major workflows.

---

## Known Limitations

* Browser-only localStorage persistence.
* No authentication.
* No cloud database.
* No cloud backup.
* No cross-device synchronization.
* No server-side authorization.
* Live currency API integration is deferred.
* Historical exchange-rate migration is deferred.
* Advanced forecasting and exportable analytics reports are deferred.

---

## Next Sprint Backlog

Recommended next sprint focus:

* Add API-backed currency conversion using the rate effective on the record date.
* Add a combined upload and paste attachment workflow.
* Continue mobile and tablet responsive QA.
* Add deeper Analytics drilldowns only after the first read-only charts are validated.
* Review bundle size and consider route-level code splitting.
* Continue preparing authentication, cloud sync, and backup as future architecture work.
