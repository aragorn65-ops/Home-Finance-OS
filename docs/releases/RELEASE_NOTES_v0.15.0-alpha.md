# Home Finance OS v0.15.0-alpha

## Currency Automation and Release Hardening

**Release Date:** July 18, 2026
**Status:** Alpha Release
**Sprint:** Sprint 15

---

## Overview

Home Finance OS v0.15.0-alpha hardens the private-alpha experience after the first Analytics and household-preferences release.

This release adds date-specific currency-rate lookup, preserves manual exchange-rate fallback, improves transaction attachment capture, refines water bill sharing around provider consumption, adds the first Analytics drilldown, clears the previous production bundle-size warning through route-level code splitting, and tightens mobile/tablet layouts.

---

## Highlights

* Added a shared currency-rate provider abstraction backed by the Frankfurter API with jsDelivr and Cloudflare fallback paths.
* Added suggested exchange-rate lookup for foreign-currency accounts, income and expense transactions, savings goals, and savings activities.
* Preserved manual exchange-rate entry as fallback.
* Stored rate source metadata so records show whether a rate was manually entered or API-provided.
* Preserved the no-history-recomputation rule for saved rates and converted amounts.
* Locked historical Dashboard expense displays to the saved transaction reporting currency when Settings base currency changes.
* Added a display-only Dashboard Quick Actions remittance calculator for converting monthly totals into another currency.
* Combined transaction upload, paste, and drag/drop into one attachment well.
* Kept attachment support for JPEG, PNG, WebP, and PDF files.
* Added inline attachment capacity feedback for the 3-file limit.
* Fixed mobile attachment flow so returning from the phone file picker keeps the transaction dialog visible and scroll-safe.
* Changed water utility bills to accept provider consumption and derive the rate internally.
* Added a month-aware Top Expense Categories drilldown in Analytics.
* Added route-level code splitting for main `/app` feature pages.
* Reduced the main production JavaScript bundle from roughly 744 kB to roughly 253 kB after minification.
* Cleared the previous Vite large-chunk warning.
* Tightened mobile/tablet layouts for Analytics and transaction attachment/detail cards.
* Let users edit household country, base currency, and time zone from Settings after setup.
* Added country-based currency and time-zone defaults with manual override options.
* Added Japan, United Kingdom, Germany, and Saudi Arabia setup preferences with matching currencies and time zones.
* Fixed Settings preference dropdown overflow in constrained layouts.

---

## Currency Rules

* Records continue to store the exchange rate and effective date used at save time.
* Existing transaction, account, savings, and settlement history is not recomputed when exchange rates change.
* Users may apply an API-suggested rate or enter a manual rate.
* API-provided records store provider metadata for user-visible audit context.
* Historical exchange-rate migration and multi-provider comparison remain deferred.

---

## Attachment Rules

* Transaction attachments support JPEG, PNG, WebP, and PDF files.
* Each attachment must be 1 MB or smaller.
* A transaction may store up to 3 attachments.
* Images continue to be prepared and compressed before save.
* Unsupported files, oversized files, and unsupported clipboard contents report validation feedback.

---

## Utility Rules

* Electricity bills continue to use a manually entered provider rate.
* Water bills now use total provider consumption and derive the rate from total bill amount divided by consumption.
* Water share previews label the computed value as a derived rate.

---

## Verification

Current verification passed:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Notes:

* The previous Vite large-chunk warning is cleared after route-level code splitting.
* Git may report existing LF-to-CRLF working-copy warnings on Windows.

---

## Manual QA Focus

Before finalizing this alpha, manually verify:

* Suggested exchange-rate lookup and manual fallback for accounts, income transactions, expense transactions, savings goals, and savings activities.
* Settings country changes auto-select the expected currency and time zone while still allowing manual overrides.
* Historical records keep their saved rate, effective date, and converted amounts until edited.
* Transaction attachments work via file picker, paste, and drag/drop.
* Attachment preview remains centered and constrained for images and PDFs.
* Analytics category drilldown respects the selected reporting month.
* Water utility bills accept provider consumption and calculate member shares from the derived rate.
* Analytics, transaction attachments, and transaction details remain readable on mobile and tablet widths.
* On mobile Chrome, attach a JPEG to a new transaction and confirm the dialog remains visible with attachment feedback after the file picker closes.

---

## Known Limitations

* Browser-only localStorage persistence.
* No authentication.
* No cloud database.
* No cloud backup.
* No cross-device synchronization.
* No server-side authorization.
* Historical exchange-rate migration is deferred.
* Multi-provider rate comparison is deferred.
* Advanced forecasting and exportable analytics reports are deferred.

---

## Next Sprint Backlog

Recommended next sprint focus:

* Prepare authentication, cloud sync, and backup architecture.
* Continue hardening responsive QA with manual device testing.
* Add additional Analytics drilldowns only where summary panels raise practical questions.
* Consider import/export or backup workflows for private-alpha data safety.
