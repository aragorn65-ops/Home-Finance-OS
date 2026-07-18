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

* [x] Save calculated utility bills as unpaid provider bills without requiring a payer.
* [x] Track provider name, amount, billing date, due date, notes, and bill attachments.
* [x] Store member share snapshots at bill-entry time.
* [x] Show Bills to Pay in Utilities.
* [x] Add Mark as Paid with payer, payment account, payment date, reference, and receipt proof.
* [x] Create the transaction and settlement obligations only when the provider bill is marked paid.
* [x] Include provider bills in local backup and Google Drive backup/restore.

---

## Progress Notes

### July 19, 2026

* Added a provider-bill repository and storage key.
* Utilities now saves calculated bills as unpaid provider bills without requiring Paid By.
* Provider name and due date are part of bill entry.
* Bills to Pay appears in Utilities for active unpaid provider bills.
* Bills to Pay shows the saved member-share breakdown for each unpaid provider bill.
* Unpaid provider bill files can be added or removed when a wrong file was attached.
* Duplicate unpaid provider bills can be deleted before any payment records are created.
* Internet can be entered as a fixed provider bill without meter readings or rate input.
* Utility/provider bill entry is separated into tabs for Bill, Members, Appliances, Files & Payment, and Review.
* Mark Paid now captures payer, account, payment date, reference, and provider-payment receipt.
* Mark Paid creates the utility expense transaction and settlement obligations from the saved share snapshot.
* Utilities shows a Provider Payments summary for paid provider bills before backup/restore QA.
* Backup/restore includes provider bills, while older backups without this collection still restore with an empty provider-bill list.

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
* Confirm paid provider bills appear in Utilities > Provider Payments.
* Confirm payment creates the transaction and settlement obligations.
* Confirm backup/restore preserves unpaid and paid provider bills.
