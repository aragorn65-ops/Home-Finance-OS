# Sprint 90

## Commit Upload-Staging Guard

**Branch:** main

---

## Intent

Sprint 90 locks migration Commit until HFOS has a verified full upload-staging
path, then adds the first safe staging marker: a manifest/count RPC that records
what would be uploaded without writing full household records.

The validated checkpoint proves identity, schema readiness, and count
consistency, but it does not prove the 208 local records have been written to
remote tables. Commit must therefore fail closed until upload staging exists.

---

## Planned Scope

* [x] Disable the Commit button after validation.
* [x] Add a local guard that blocks commit before any remote Commit RPC can run.
* [x] Explain in the button title that commit requires full record upload
      staging in a later sprint.
* [x] Add regression coverage for the fail-closed commit guard.
* [x] Add a stage upload manifest action for validated checkpoints.
* [x] Store staged upload manifest/count metadata in Supabase.
* [x] Surface upload-staged timestamp/count diagnostics in migration
      checkpoints.
* [x] Keep Commit locked after manifest staging.

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
* Manual Settings check: validated checkpoints can stage the manifest, show the
  upload-staged lifecycle timestamp, and still show Commit locked.

---

## Notes For Next Step

The next sprint should introduce full record upload staging behind the same
explicit action and rollback checks. The manifest is only a metadata checkpoint.
