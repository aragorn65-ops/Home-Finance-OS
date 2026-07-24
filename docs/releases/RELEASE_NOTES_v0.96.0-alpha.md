# Release Notes v0.96.0-alpha

## Expense Source-Account Staging Backfill

Home Finance OS v0.96.0-alpha hardens transaction staging after the
pre-commit audit identified staged expenses without source accounts.

---

## Changed

* Expense detection in `stage_migration_transactions` now normalizes the staged
  transaction type before checking for `expense`.
* Transaction staging now backfills staged expense rows that still have no
  source account by assigning the household Cash account.
* `audit_migration_precommit` now reports the count of staged expenses missing
  source accounts.

---

## Safety

* Local browser data is not changed.
* Commit remains locked.
* Remote CRUD and automatic sync remain disabled.
