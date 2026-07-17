# Home Finance OS Sprint 15

## Currency Automation and Release Hardening

**Release:** v0.15.0-alpha
**Date:** TBD
**Branch:** TBD
**Status:** Planned

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

---

## Analytics Follow-Up Scope

Recommended first slice:

* Validate the current read-only Analytics charts with real June and July data.
* Add drilldowns only where the summary card raises a practical question.
* Keep all Analytics views month-aware.
* Keep settlement analytics tied to original transaction month.
* Avoid demo data in empty states.

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
* Known Vite bundle-size warning remains non-blocking unless code splitting is completed.

---

## Sprint Result

Sprint 15 is planned.
