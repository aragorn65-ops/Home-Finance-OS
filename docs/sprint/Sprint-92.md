# Sprint 92

## Transaction Upload Staging

**Branch:** main

---

## Intent

Sprint 92 adds explicit transaction upload staging after account staging.
Transactions are written to Supabase by local record id and resolve source and
destination account links through the already-staged account rows.

Commit remains locked. This sprint proves the next core record group can be
staged without turning remote storage into the source of truth.

---

## Planned Scope

* [x] Add a transaction upload payload scoped to the current local household.
* [x] Add a Supabase `stage_migration_transactions` RPC for owned, validated
      drafts with account staging complete.
* [x] Verify staged transaction counts against the migration checkpoint.
* [x] Resolve source and destination account links from staged account local
      record ids when present.
* [x] Track transaction-staged count and timestamp on migration drafts.
* [x] Surface the transaction-staged lifecycle in migration checkpoint
      diagnostics.
* [x] Keep Commit locked after transaction staging.
* [x] Clean staged transaction rows before staged account rows when aborted.

---

## Out Of Scope

* Expense allocation upload staging.
* Settlement, provider bill, and savings staging.
* Household-member ownership remapping beyond the claimed remote owner.
* Account-link reconciliation for transactions whose local account reference is
  missing or not staged.
* Remote CRUD.
* Automatic multi-device sync.
* Commit unlock.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Settings check: after applying the updated Supabase SQL, a checkpoint
  with staged accounts can stage transactions, show the transaction-staged
  lifecycle timestamp, and still show Commit locked.

---

## Notes For Next Step

The next sprint should inspect transaction account-link gaps before expense
allocation staging. Allocation staging should only proceed after we understand
which local transaction account references are missing or not staged.
