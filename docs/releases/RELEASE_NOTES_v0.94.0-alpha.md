# Release Notes v0.94.0-alpha

## Cash Fallback During Transaction Staging

Home Finance OS v0.94.0-alpha makes transaction staging more repeatable by
linking expense transactions with missing or unresolved source accounts to the
staged household Cash account.

---

## Changed

* `stage_migration_transactions` now applies a Cash fallback for expense source
  account links.
* The fallback uses staged active asset accounts with `account_type = 'cash'`.
* When multiple cash accounts exist, an account named `cash` is preferred.
* Transaction count validation and staging guards remain unchanged.

---

## Safety

* Local transaction data is not mutated.
* Commit remains locked.
* Expense allocation staging, remote CRUD, and automatic sync remain disabled.
