# Sprint 96

## Expense Source-Account Staging Backfill

**Branch:** main

---

## Intent

Sprint 96 hardens the transaction staging RPC after the pre-commit audit found
staged expenses without source accounts.

The fix keeps the migration flow conservative: Commit remains locked, but
rerunning transaction staging can repair staged expense rows by assigning the
household Cash account.

---

## Planned Scope

* [x] Normalize staged transaction type checks before detecting expenses.
* [x] Backfill staged expense rows with the active household Cash account when
  `source_account_id` is still missing.
* [x] Preserve the Cash account preference for an account named `cash`.
* [x] Improve the audit blocker with the missing expense source-account count.
* [x] Keep Commit locked.

---

## Out Of Scope

* Mutating local browser transactions.
* Commit unlock.
* Remote CRUD.
* Automatic sync.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Supabase check: rerun the updated function, click **Stage
  transactions**, then **Audit commit**. Expected: the expense source-account
  blocker clears.
