# Sprint 99

## Commit Owner-Link Resolution

**Branch:** main

---

## Intent

Sprint 99 fixes the final local preflight before migration commit for claimed
households whose Supabase owner-member id differs from the local browser member
id.

The Supabase commit RPC remains the final authority. The local app now resolves
the browser household owner for authenticated-link persistence after the remote
commit succeeds.

---

## Planned Scope

* [x] Allow commit preflight to use the active local household owner when the
  remote checkpoint owner is not present as a local member id.
* [x] Keep conflicting authenticated-link protection in place.
* [x] Keep upload staging, account staging, transaction staging, and pre-commit
  audit guards in place.
* [x] Refresh commit-unlock checklist copy so passed gates show Commit as ready.
* [x] Add focused coverage for remote-only owner-member ids.

---

## Out Of Scope

* Automatic multi-device sync.
* Conflict resolution.
* Remote CRUD.
* Additional migration domains.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual app check: refresh diagnostics, rerun **Audit commit**, then confirm
  **Commit** is enabled for the validated checkpoint.
