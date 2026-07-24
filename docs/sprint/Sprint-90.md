# Sprint 90

## Commit Upload-Staging Guard

**Branch:** main

---

## Intent

Sprint 90 starts by locking migration Commit until HFOS has a verified full
upload-staging path.

The validated checkpoint proves identity, schema readiness, and count
consistency, but it does not prove the 208 local records have been written to
remote tables. Commit must therefore fail closed until upload staging exists.

---

## Planned Scope

* [x] Disable the Commit button after validation.
* [x] Add a local guard that blocks commit before any remote Commit RPC can run.
* [x] Explain in the button title that commit requires full upload staging in a
      later sprint.
* [x] Add regression coverage for the fail-closed commit guard.

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
* Manual Settings check: validated checkpoints show Commit locked.

---

## Notes For Next Step

The next Sprint 90 slice should define the upload-staging RPC contract and
batch manifest, but still keep writes behind explicit user action and rollback
checks.
