# Release Notes v0.92.0-alpha

## Transaction Upload Staging

Home Finance OS v0.92.0-alpha adds explicit transaction upload staging after
account staging. This expands the migration path from manifest plus accounts to
the first linked financial activity records.

---

## Changed

* Added a Stage transactions action to migration checkpoints after Stage
  accounts.
* Added Supabase transaction staging metadata on migration drafts.
* Added a Supabase RPC that upserts staged transaction rows by household and
  local record id.
* Staged transactions resolve source and destination accounts through staged
  account local record ids.
* Migration checkpoints now show a transaction-staged lifecycle timestamp.
* Abort now removes staged transaction rows before staged account rows.
* Added regression coverage for transaction payload mapping and adapter staging
  contracts.

---

## Safety

* Commit remains locked after transaction staging.
* Transaction staging requires account staging first.
* Transaction staging must match the checkpoint transaction count.
* Transaction member ownership uses the claimed remote owner until household
  member mapping is introduced in a later sprint.
* Expense allocations, settlements, provider bills, savings, remote CRUD, and
  automatic multi-device sync remain disabled.
