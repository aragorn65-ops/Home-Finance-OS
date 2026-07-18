# Home Finance OS Sprint 19

## Provider Bills & Payment Tracking

**Release:** v0.19.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-19-provider-bills
**Status:** Open

---

## Sprint Objective

Sprint 19 adds a provider-bill layer between bill entry and member reimbursement.

HFOS should let a household enter a utility/provider bill when it is received, calculate each member's share immediately, and keep the bill as unpaid until a household member pays the provider. Only after payment should HFOS create the expense transaction and settlement obligations that answer who owes whom.

---

## Planned Scope

Sprint 19 candidates include:

* Save calculated utility bills as unpaid provider bills without requiring a payer.
* Track provider name, amount, billing date, due date, notes, and bill attachments.
* Store member share snapshots at bill-entry time.
* Show Bills to Pay in Utilities.
* Add Mark as Paid with payer, payment account, payment date, reference, and receipt proof.
* Create the transaction and settlement obligations only when the provider bill is marked paid.
* Include provider bills in local backup and Google Drive backup/restore.

---

## Accounting Rules

Provider bills should:

* Calculate member shares as soon as the bill is entered.
* Remain separate from member settlement obligations while unpaid.
* Require a payer only when marked paid.
* Preserve the original calculated member shares when payment happens later.
* Store provider payment receipts separately from member settlement transfer receipts.

Provider bills should not:

* Create who-owes-who settlement obligations before provider payment.
* Recompute historical utility shares after the bill is saved.
* Replace transaction receipts or settlement transfer receipts.
* Auto-sync in the background.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Manual QA should include:

* Enter an electricity provider bill with no payer and save it as unpaid.
* Confirm member shares are shown before payment.
* Confirm unpaid provider bills appear in Utilities.
* Mark a provider bill as paid with payer, account, reference, and receipt.
* Confirm payment creates the transaction and settlement obligations.
* Confirm backup/restore preserves unpaid and paid provider bills.
