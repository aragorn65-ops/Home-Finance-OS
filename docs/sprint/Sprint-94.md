# Sprint 94

## Cash Fallback During Transaction Staging

**Branch:** main

---

## Intent

Sprint 94 bakes the production-discovered cash reconciliation into transaction
staging. Expense transactions with a missing or unresolved local source account
now link to the staged household Cash account when one exists.

This keeps transaction staging repeatable without requiring a manual SQL update
after each staging run.

---

## Planned Scope

* [x] Add a cash-account fallback inside `stage_migration_transactions`.
* [x] Use only staged active asset accounts with `account_type = 'cash'`.
* [x] Prefer an account named `cash` when multiple cash accounts exist.
* [x] Keep count validation and transaction staging guards unchanged.
* [x] Keep Commit locked.

---

## Out Of Scope

* Changing local transaction source-account data.
* General account-link reconciliation UI.
* Expense allocation upload staging.
* Remote CRUD.
* Automatic multi-device sync.
* Commit unlock.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Supabase check: after rerunning the updated transaction staging
  function and staging transactions, expense rows missing a source account are
  linked to the staged Cash account.

---

## Notes For Next Step

With account and transaction staging repeatable, the next sprint can prepare
expense allocation staging. It should resolve allocation transaction links by
local record id and keep member mapping conservative.
