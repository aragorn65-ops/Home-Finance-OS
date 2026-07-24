# Sprint 98

## Guarded Migration Commit Unlock

**Branch:** main

---

## Intent

Sprint 98 unlocks the migration Commit action only after the staged data has
passed the visible checklist and pre-commit audit.

This is still a controlled migration action, not automatic sync. Commit marks
the remote migration draft as committed and saves the authenticated household
link locally.

---

## Planned Scope

* [x] Replace the local "full upload staging not implemented" blocker with
  explicit staging and pre-commit audit guards.
* [x] Enable the Commit button only when the checklist is ready and the draft is
  still validated.
* [x] Add Supabase commit-time guards for staging lifecycle, staged counts, and
  missing account links.
* [x] Keep remote CRUD and automatic sync disabled.
* [x] Add focused tests for the new local commit guard behavior.

---

## Out Of Scope

* Automatic multi-device sync.
* Conflict resolution.
* Live remote CRUD.
* Additional staging domains.
* Account recovery.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Supabase check: rerun the updated `commit_migration_draft` function,
  refresh the app, run **Audit commit**, then confirm **Commit** is enabled.
