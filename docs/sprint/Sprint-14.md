# Home Finance OS Sprint 14

## Analytics and Household Preferences

**Release:** v0.14.0-alpha
**Date:** July 17, 2026
**Branch:** sprint-14-analytics-settings
**Status:** Closed

---

## Sprint Objective

Sprint 14 introduces the first dedicated Analytics section and begins household preference controls.

The sprint should build on Sprint 13's month-aware behavior. Analytics must respect the selected reporting month, avoid mixing activity across months, and reuse existing transaction, savings, settlement, account, and utility data services where possible.

---

## Planned Scope

Sprint 14 includes:

* Add an Analytics route and sidebar navigation entry.
* Create the first analytics dashboard page.
* Add month-aware analytics cards and summaries.
* Reuse existing services before adding new data structures.
* Keep the first analytics release read-only.
* Add Settings groundwork for light/dark theme selection.
* Add Settings groundwork for base currency selection.
* Document currency conversion rules before API integration.
* Preserve Sprint 13 month-isolation behavior.
* Continue private-alpha responsive cleanup based on testing feedback.

---

## Analytics First Slice

Recommended initial analytics cards:

* Monthly income total.
* Monthly expense total.
* Monthly net cash flow.
* Top expense categories.
* Settlement status for selected month.
* Savings contributions for selected month.
* Six-month income versus expense trend.

Recommended behavior:

* Use the shared reporting month selector.
* Date filters must use the original transaction or activity date.
* Settlement analytics should follow original transaction month, not settlement payment date.
* Analytics should show empty states rather than demo data when no records exist.

Implemented:

* Analytics route and sidebar navigation entry.
* Read-only Analytics page shell.
* Shared reporting month selector.
* Monthly income, expenses, and net cash-flow cards.
* Six-month income versus expense chart.
* Top expense categories.
* Utility cost analytics for electricity, water, and internet.
* Settlement status by selected transaction month.
* Savings contribution and goal-progress analytics.
* Account position analytics for assets, liabilities, and net worth.

---

## Settings Scope

### Theme

Add a Settings section for:

* Light theme.
* Dark theme.
* System default, if feasible.

Initial implementation may store the choice locally and apply CSS variables. Full visual polish can continue after the first working setting exists.

Implemented:

* Local theme preference storage.
* Settings selector for System Default, Light, and Dark.
* App startup applies the stored preference.
* Initial dark semantic token overrides.

### Base Currency

Add a Settings section for:

* Base household currency selector.
* Current household currency display.
* Future API-backed conversion note.

Design note:

* See [Sprint 14 Currency Design Note](Sprint-14-Currency-Design.md).

Currency conversion rule:

* Store the rate effective on the date a record is created or used.
* Do not recompute historical records when present or future exchange rates change.
* No backward/history recomputation.
* Mixed-currency records must be considered before full implementation.
* Savings needs special handling for outside remittances from abroad, where a contribution may be entered in a foreign currency but reported against the household base currency.
* Savings also needs to support goals denominated in a foreign currency, such as a PHP-base household saving for a USD vacation or trip budget.
* Foreign-currency savings goals should preserve the goal currency and target amount while still exposing a base-currency equivalent for household reporting.
* Future savings activity records should preserve the entered currency, entered amount, effective exchange rate, and converted base-currency amount used for reporting.

Implemented:

* Settings selector for household base currency.
* Household currency storage update.
* UI note that historical amounts are not converted or recomputed.
* UI note that future API conversion will use the rate effective on the record date.
* Savings goals can store a goal currency, base currency equivalent, manual exchange rate, and effective date.
* Savings activities can store entered amount/currency, goal-currency amount, base-currency amount, manual exchange rate, and effective date.
* Savings progress displays in the goal currency while household Savings summaries use base-currency equivalents.
* Savings goals can be deleted with their activity history, reversing linked account balance effects before removal.
* Income transactions can store entered amount/currency, base amount/currency, manual exchange rate, and effective date.
* Transaction lists and details show the original foreign income amount when it differs from the household base currency.
* Accounts can store an account currency, base reporting currency, manual exchange rate, rate effective date, and base-currency balance equivalents.
* Account, Dashboard, and Analytics net-worth totals use stored base-currency reporting balances instead of directly mixing native account currencies.
* Centered validation summary popups were added to major data-entry workflows so blocked Save/Update actions identify the invalid fields clearly.
* Validation popups now cover Transactions, Accounts, Savings goals and activities, Settlements, and Utilities.

---

## Deferred Scope

The following are not required for the first Sprint 14 slice:

* Live currency API integration.
* Historical exchange-rate migration.
* Authentication.
* Cloud sync.
* Server-side authorization.
* Advanced forecasting.
* Exportable analytics reports.

---

## Data Compatibility Notes

Implemented:

* Existing localStorage records hydrate with safe currency fallbacks where older records do not yet have currency fields.
* Older accounts default to PHP reporting currency and exchange rate `1` unless edited with explicit currency details.
* Older income transactions default to the household/base currency when entered-currency fields are missing.
* Older savings goals and savings activity records default missing currency metadata from their existing amount fields.
* Compatibility hydration does not rewrite or recompute historical records unless the user edits or saves the record.

---

## Sprint 15 Candidates

Recommended next sprint focus:

* Add API-backed currency conversion using the rate effective on the record date.
* Add a combined upload and paste attachment workflow.
* Continue mobile and tablet responsive QA.
* Add deeper Analytics drilldowns after the first read-only charts are validated.
* Review bundle size and consider route-level code splitting.
* Continue preparing authentication, cloud sync, and backup as future architecture work.

---

## UI Polish Notes

Implemented:

* The Partially Paid status badge now uses a stronger `#d2c02a` background while keeping the existing amber text color for readability.
* Recent Activity transaction icons on the Dashboard now use the same blue info treatment as settlement activity icons to better match the overall product color theme.

---

## Verification Targets

Sprint 14 verification currently passes:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Expected result:

* TypeScript build passes.
* Vite production build passes.
* ESLint has zero errors.
* Whitespace check passes.
* Known Vite bundle-size warning remains non-blocking unless code splitting is completed.
* Existing LF-to-CRLF working-copy warnings on Windows remain non-blocking.

---

## Manual QA Checklist

Before closing Sprint 14, verify:

* Analytics respects the selected reporting month and does not mix June and July data.
* Dashboard recent activity respects the selected reporting month.
* Settlement analytics follow the original transaction month, not the payment date.
* Base-currency account totals use reporting balances and do not directly mix native currencies.
* Foreign-currency income records show the entered currency amount and base-currency reporting equivalent.
* Deleting income transactions reverses linked account balance effects.
* Savings goals display progress in the goal currency and summaries in the household base currency.
* Deleting savings goals reverses linked account balance effects before removal.
* Validation popups appear centered and identify invalid fields on blocked Save or Update actions.
* Transaction receipt uploads handle JPEG, PNG, WebP, and PDF files up to the configured limit.
* Light and dark themes keep forms, cards, dropdowns, dialogs, and sidebar selection readable.

---

## Sprint Result

Sprint 14 is officially closed on July 18, 2026.

The Analytics first slice, theme Settings groundwork, base-currency Settings groundwork, mixed-currency account and savings support, validation popups, and current UI polish items are implemented.
