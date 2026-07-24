# Release Notes v0.91.0-alpha

## Account Upload Staging

Home Finance OS v0.91.0-alpha adds explicit account upload staging for
validated, manifest-staged migration checkpoints. This is the first full-record
remote staging step, but Commit, remote CRUD, and automatic sync remain locked.

---

## Changed

* Added a Stage accounts action to migration checkpoints after Stage upload.
* Added Supabase account staging metadata on migration drafts.
* Added a Supabase RPC that upserts staged account rows by household and local
  record id.
* Migration checkpoints now show an account-staged lifecycle timestamp when
  account staging succeeds.
* Abort now removes staged local-record account rows for the draft household.
* Added regression coverage for account payload mapping and adapter staging
  contracts.

---

## Safety

* Commit remains locked after account staging.
* Account staging must match the checkpoint account count.
* Staged account rows use the claimed remote owner until household-member
  mapping is introduced in a later sprint.
* Transactions, allocations, settlements, provider bills, savings, remote CRUD,
  and automatic multi-device sync remain disabled.
