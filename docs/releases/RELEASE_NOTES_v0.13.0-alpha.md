# Home Finance OS v0.13.0-alpha

## Private Alpha Readiness

**Release Date:** July 17, 2026
**Status:** Alpha Release
**Sprint:** Sprint 13

---

## Overview

Home Finance OS v0.13.0-alpha focuses on private-alpha stabilization.

This release tightens month-aware reporting, settlement behavior, attachment handling, responsive layout, shared UI styling, and data-entry ergonomics after June and July manual workflow testing.

---

## Highlights

* Dashboard, Transactions, Settlements, Utilities, and Recent Activity now preserve the selected reporting month.
* June and July activity remain isolated from each other.
* Settlement summaries are based on the original transaction month, not the reimbursement date.
* Dashboard shows a green All Settled state when a selected month has no outstanding settlement items.
* Dashboard shows red itemized outstanding settlement categories when unpaid items remain.
* Transaction attachment handling supports JPEG, PNG, WebP, and PDF files up to 1 MB each.
* Transaction category selection is stricter to protect summary reporting.
* Currency inputs and displayed amounts use two-decimal currency formatting.
* Settlement history now shows itemized full/partial settlement details.
* Settlement reference numbers can be auto-generated for app recording.
* Settlement manual application shows running subtotals from selected items.
* The settlement history card layout was tightened for faster scanning.
* Dialogs and floating windows were constrained to stay usable within the browser viewport.
* Core buttons were unified with blue backgrounds, white text, and gray hover states.

---

## Verification

Final verification passed:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Known non-blocking warning:

* The main Vite JavaScript bundle remains above the default size warning threshold.

---

## Known Limitations

* Browser-only localStorage persistence.
* No authentication.
* No cloud database.
* No cloud backup.
* No cross-device synchronization.
* No server-side authorization.
* Header search, notification, and profile workflows remain placeholders unless completed or clearly disabled.
* Combined upload/paste attachment workflow is deferred.

---

## Next Sprint Backlog

Recommended next sprint focus:

* Add an Analytics section.
* Add Settings support for light and dark theme selection.
* Add a base-currency selector and API-backed currency converter.
* Store currency rates effective on the date a record is created or used.
* Do not recompute historical records when present or future exchange rates change.
* Continue mobile/tablet refinement based on private-alpha tester feedback.
