# Home Finance OS Sprint 13

## Private Alpha Readiness

**Release:** v0.13.0-alpha
**Date:** July 16, 2026
**Branch:** sprint-13-alpha-readiness
**Status:** Closed
**Closed:** July 17, 2026

---

## Sprint Objective

Sprint 13 prepares Home Finance OS for private alpha testing.

The sprint focuses on stabilization, accessibility, month-aware reporting, responsive cleanup, and tester readiness rather than introducing a major new finance module.

HFOS should end this sprint in a releasable private-alpha state with clear known limitations, verified core workflows, and user-facing behavior that does not appear unfinished or misleading.

---

## Planned Scope

Sprint 13 includes:

* Full end-to-end regression testing
* Dialog focus management and focus restoration
* Month-aware transaction filtering
* Month-aware Dashboard cash-flow reporting
* Route-level code splitting investigation
* User-facing persistence error feedback review
* Remaining feature-page responsive cleanup
* Empty-state standardization
* Sample-data controls review
* Private deployment preparation
* Tester instructions
* Feedback collection workflow
* Critical alpha issue resolution
* v0.13.0-alpha release documentation

---

## Initial Work Started

The Sprint 13 branch has started with:

* Shared Dialog focus trapping, Escape handling, focus restoration, and stacked-dialog handling.
* Dialog title and description registration for accessible labelling.
* Month selection utilities for month inputs and month comparisons.
* Transaction page month filtering.
* Default new-transaction dates based on the selected transaction month.
* Dashboard month selection.
* Dashboard cash-flow totals based on the selected month.
* Cash-flow chart data generated from actual persisted transactions instead of demo monthly values.
* Compact shared Dashboard layout for household-level activity.
* Account-holder reporting separated onto a dedicated page for future login-based visibility.

---

## Deferred Authentication Scope

Login and true account-holder authorization should be added in a later sprint after private alpha UI validation.

Recommended future scope:

* Sign-in and sign-out workflow
* Current household member identity
* Route guard for `/app/account-holder`
* Account-holder-only visibility checks
* Server-side authorization when cloud persistence is introduced
* Migration from browser-only localStorage to authenticated persistence

---

## Next Sprint Backlog Notes

The next sprint should add an Analytics section.

Recommended initial scope:

* Add an Analytics route and navigation entry.
* Define the first analytics dashboard cards and charts.
* Reuse existing transaction, savings, settlement, and account data services.
* Keep analytics month-aware and aligned with the current Dashboard reporting behavior.
* Add a Settings option for Light and Dark theme selection.
* Add a base-currency selector with API-backed currency conversion.
* Store the currency rate effective on the day a record is created or used.
* Do not recompute historical records when present or future exchange rates change.

---

## Alpha Readiness Checklist

### Core Workflow Regression

* Household setup
* Household member management
* Accounts
* Transactions
* Attachments
* Shared expenses
* Settlements
* Utilities
* Savings
* Dashboard
* Persistence after refresh
* Reset All Data
* Private account ownership
* Inactive account behavior
* Mobile feature forms

### Alpha Data-Entry Observations

* Transaction workflow is smooth so far during manual June and July data entry.
* Transaction calculations and logic are holding during current test-data input.
* Manual June and July data entry is complete.
* Dashboard, Transactions, Settlements, Utilities, and Recent Activity preserve the selected reporting month.
* June activity no longer appears in July, and July activity no longer appears in June.
* Settlement summaries are month-specific by original transaction date, not reimbursement date.
* Example verified behavior: a June 29 grocery settled on July 4 remains part of June settlement context.
* Dashboard shows a green All Settled state when the selected month has no outstanding settlement items.
* Dashboard shows red itemized outstanding settlement categories when the selected month has unpaid items.
* Receipt and bill uploads support JPEG, PNG, WebP, and PDF files up to 1 MB each.
* Before closing Sprint 13, consider combining upload and paste into one attachment area for simpler data entry.
* When a household member is added mid-month, sharing calculations should apply from the member's effective date onward only.
* Member additions, removals, or participation changes must not recompute historical transaction, utility, or settlement shares.
* Regression risk from previous app: adding a new expense must not revert already paid past expenses or settled allocations back to unpaid.
* Bug report: transaction window crashed after uploading a receipt on a groceries expense using shared plus personal items; attachment handling has been hardened and should be retested with JPEG and PDF uploads before release.

### Accessibility

* Dialog focus enters open dialogs.
* Tab focus remains inside the active dialog.
* Escape closes dismissible dialogs.
* Focus returns to the launching control when dialogs close.
* Non-dismissible dialogs do not close from Escape.
* Dialogs expose accessible names.
* Keyboard focus indicators remain visible.

### Responsive Review

* Dashboard
* Transactions
* Accounts
* Savings
* Settlements
* Household management
* Dialogs
* Header and sidebar navigation

### Privacy Review

Accounts remain strictly private to their owners.

Other household members, including administrators, must not see or use another member's:

* Private account name
* Private account balance
* Private account details
* Private account selection option

Transaction, Savings, Dashboard, and reporting workflows must preserve existing service-layer ownership protections.

---

## Verification Targets

Sprint 13 should verify:

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

Latest verification:

* `npm.cmd run build` passed.
* `npm.cmd run lint` passed with zero warnings.
* `git diff --check` passed with no whitespace errors.
* Vite bundle-size warning remains known and non-blocking for Sprint 13.

---

## Known Limitations Carried Into Sprint

* Browser-only localStorage persistence.
* No authentication.
* No cloud database.
* No cloud backup.
* No cross-device synchronization.
* No server-side authorization.
* Main JavaScript bundle remains above Vite's default warning threshold.
* Header search, notification, and profile workflows remain placeholders unless completed or clearly disabled.

---

## Sprint Result

Sprint 13 is closed.

The sprint completed private-alpha readiness stabilization, month-aware reporting cleanup, attachment hardening, settlement workflow refinement, and final verification.

Release handoff:

* Release notes: `docs/releases/RELEASE_NOTES_v0.13.0-alpha.md`
* Final verification passed: build, lint, and whitespace checks.
* Remaining known limitations are intentionally carried forward to the next sprint.
