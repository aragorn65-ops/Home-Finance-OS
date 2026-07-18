# Home Finance OS Sprint 15

## Currency Automation and Release Hardening

**Release:** v0.15.0-alpha
**Date:** July 18, 2026
**Branch:** sprint-15-currency-automation
**Status:** Closed

---

## Sprint Objective

Sprint 15 should build on Sprint 14's Analytics, Settings, and mixed-currency groundwork.

The main goal is to harden the private-alpha experience before adding larger platform features. Currency automation, attachment workflow cleanup, responsive QA, and analytics refinement should stay grounded in the current browser-local architecture.

---

## Planned Scope

Sprint 15 candidates include:

* Add API-backed currency conversion using the rate effective on the record date.
* Keep the no-history-recomputation rule from Sprint 14.
* Add a combined upload and paste attachment workflow.
* Continue mobile and tablet responsive QA.
* Add deeper Analytics drilldowns after the first read-only charts are validated.
* Review bundle size and consider route-level code splitting.
* Continue preparing authentication, cloud sync, and backup as future architecture work.

---

## Currency Conversion Scope

Recommended first slice:

* Keep manual exchange-rate entry available as a fallback.
* Add a currency-rate provider abstraction before wiring a live API.
* Store the exchange rate and effective date on each record at save time.
* Do not recompute existing transaction, account, savings, or settlement history when rates change.
* Clearly show when a rate was manually entered versus API-provided.

Implemented:

* Added a shared currency-rate provider abstraction backed by the Frankfurter API for date-specific exchange rates, with jsDelivr and Cloudflare currency API fallback paths for resilience.
* Added a reusable rate lookup control that lets users explicitly apply a suggested API rate while preserving manual entry as fallback.
* Added suggested-rate lookup to foreign-currency accounts, foreign-currency income and expense transactions, savings goals, and savings activities.
* Stored rate source metadata on accounts, income and expense transactions, savings goals, and savings activities.
* Preserved the no-history-recomputation rule: saved records keep their stored rate, effective date, and source until edited.
* Displayed manual versus API rate source in account cards, foreign-currency transaction details, savings goal details, and savings activity history.
* Locked Dashboard expense and settlement displays to saved transaction reporting currency so later base-currency preference changes do not relabel historical totals.
* Added a display-only remittance calculator under Dashboard Quick Actions that converts locked monthly expense and outstanding-settlement totals into another currency without rewriting history.

Deferred:

* Historical exchange-rate migration.
* Recomputing old records.
* Multi-provider rate comparison.
* Server-side currency services.

---

## Attachment Workflow Scope

Recommended first slice:

* Combine upload and paste into one transaction attachment window.
* Keep the existing file-size guardrails.
* Preserve support for JPEG, PNG, WebP, and PDF files.
* Keep attachment previews centered and constrained inside the browser viewport.
* Show clear validation feedback when a file is too large or unsupported.

Implemented:

* Combined transaction upload, paste, and drag/drop into one attachment well.
* Kept JPEG, PNG, WebP, and PDF support with the existing 1 MB per-file and 3-file limits.
* Added inline attachment capacity feedback beside the combined attachment control.
* Continued routing invalid file type, size, and clipboard feedback through the centered validation alert.
* Fixed mobile attachment flow so returning from the phone file picker keeps the dialog scroll-safe and shows the attachment section instead of leaving the user at the bottom of the form.

---

## Analytics Follow-Up Scope

Recommended first slice:

* Validate the current read-only Analytics charts with real June and July data.
* Add drilldowns only where the summary card raises a practical question.
* Keep all Analytics views month-aware.
* Keep settlement analytics tied to original transaction month.
* Avoid demo data in empty states.

Implemented:

* Added a month-aware expense category drilldown beneath Top Expense Categories.
* Let users select a category from the category summary and review the underlying transactions for the selected reporting month.
* Preserved empty states when the selected month has no expenses.
* Kept settlement analytics tied to original transaction month.

---

## Bundle Hardening Scope

Implemented:

* Added route-level code splitting for the main `/app` feature pages.
* Kept Startup and Household setup eagerly loaded so the first-run path remains straightforward.
* Added a lightweight route loading fallback for lazy feature pages.
* Reduced the production main JavaScript bundle from roughly 744 kB to roughly 253 kB after minification.
* Cleared the previous Vite large-chunk warning in the production build.

---

## Responsive QA Scope

Implemented:

* Tightened Analytics mobile layout for dense amounts, category rows, settlement rows, savings goal rows, and drilldown items.
* Reduced overflow risk in Analytics by allowing long values and labels to wrap at narrow widths.
* Improved transaction attachment/detail cards so actions stack cleanly in narrow dialogs.
* Fixed Settings household-preference dropdown overflow and long selected values in dark and narrow layouts.
* Made mobile dialogs top-anchored and viewport-scrollable so tall forms remain reachable after browser viewport changes.
* Kept mobile and tablet page layouts on single-column grids where summary panels would otherwise compress.

---

## Settings Preference Refinement

Implemented:

* Let users edit country, base currency, and time zone in Settings after household setup.
* Added country defaults that auto-select currency and time zone for listed countries during setup and later Settings edits.
* Added manual override paths for country, currency, and time zone when a household preference is not listed.
* Expanded setup preferences with Japan, United Kingdom, Germany, Saudi Arabia, and their corresponding currency and time-zone options.
* Added Australia/Melbourne as a listed time-zone option and clarified that country defaults may still need regional time-zone confirmation.
* Preserved the no-history-recomputation rule when base currency is changed from Settings and kept historical Dashboard totals labeled with their saved reporting currency.
* Added contextual Settings warning guidance inside the preference box when saved transactions exist, explaining that base-currency changes affect future defaults only while historical records stay locked; the warning is hidden for households with no transactions.
* Added a household-preserving Clear Test Data action for repeated QA cleanup of accounts, transactions, settlements, savings, utility-bill records, and leftover HFOS preview keys.
* Kept Reset All Application Data as the full delete-and-return-to-setup path while preserving display-only preferences such as theme.
* Initialized new households with empty financial collections so first-time setup starts with zero transactions instead of demo records.

---

## Utility Bill Refinement

Implemented:

* Changed water bills to ask for provider consumption in `m<sup>3</sup>` instead of asking the user to enter a rate per unit.
* Derived the water rate internally from total bill amount divided by provider consumption.
* Kept electricity bills on manual provider rate entry.
* Updated water bill preview copy so the computed rate is shown as a derived rate while member share calculations continue to use the effective rate.

---

## Verification Targets

Sprint 15 should continue to verify:

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
* Vite bundle-size warning should remain cleared after route-level code splitting.

---

## Sprint Result

Sprint 15 is officially closed on July 18, 2026.

The currency automation first slice, attachment workflow cleanup, route-level code splitting, the first Analytics drilldown, Settings household-preference refinement, utility water-bill consumption entry, and mobile/tablet responsive hardening are implemented and verified.
