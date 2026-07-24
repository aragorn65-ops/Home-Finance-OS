# Sprint 89

## Migration Upload Dry-Run Contract

**Branch:** main

---

## Intent

Sprint 89 adds a local dry-run contract before migration validation can call the
remote Supabase validation RPC.

The goal is to prove the current browser data still matches the uploaded
migration checkpoint counts before HFOS introduces any full-record upload or
sync behavior.

---

## Planned Scope

* [x] Build a pure dry-run upload contract from the migration checkpoint backup
      summary and current browser data health summary.
* [x] Compare household, account, transaction, allocation, settlement, savings,
      and provider bill counts.
* [x] Block migration validation when current local data drifted after the
      checkpoint upload.
* [x] Show the dry-run record-count summary in the migration checkpoint panel.
* [x] Add focused tests for matching counts, local drift, and inconsistent
      checkpoint totals.

---

## Out Of Scope

* Uploading full household records.
* Remote CRUD.
* Automatic multi-device sync.
* Realtime subscriptions.
* Conflict resolution.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Settings check: migration checkpoint panel shows the dry-run upload
  contract before validation.

---

## Notes For Sprint 90

Sprint 90 can define the first RPC contract for staging upload batches, but it
should keep writes behind explicit user action and preserve the local-first
rollback boundary.
