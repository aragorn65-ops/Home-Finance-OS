# Sprint 91

## Account Upload Staging

**Branch:** main

---

## Intent

Sprint 91 adds the first full-record upload staging path after the manifest:
validated and manifest-staged checkpoints can explicitly stage account records
into Supabase while Commit remains locked.

This keeps migration work incremental. Accounts are the smallest useful remote
record set and let diagnostics prove real table writes before transactions,
allocations, settlements, utilities, savings, or sync behavior are enabled.

---

## Planned Scope

* [x] Add an account upload payload that strips local household/member ownership
      fields before remote staging.
* [x] Add a Supabase `stage_migration_accounts` RPC for owned, validated,
      manifest-staged drafts.
* [x] Verify staged account counts against the migration checkpoint.
* [x] Upsert accounts by household and local record id.
* [x] Track account-staged count and timestamp on migration drafts.
* [x] Surface the account-staged lifecycle in migration checkpoint diagnostics.
* [x] Keep Commit locked after account staging.
* [x] Clean staged account rows when a non-committed draft is aborted.

---

## Out Of Scope

* Transaction upload staging.
* Expense allocations, settlements, provider bills, and savings staging.
* Household-member ownership remapping beyond the claimed remote owner.
* Remote CRUD.
* Automatic multi-device sync.
* Commit unlock.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Settings check: after applying the updated Supabase SQL, a validated
  and manifest-staged checkpoint can stage accounts, show the account-staged
  lifecycle timestamp, and still show Commit locked.

---

## Notes For Next Step

The next sprint should stage transactions only after accounts are staged and
queryable. Transaction staging should keep the same count checks and continue
leaving Commit locked.
