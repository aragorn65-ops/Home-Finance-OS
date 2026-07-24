# Release Notes v0.98.0-alpha

## Guarded Migration Commit Unlock

Home Finance OS v0.98.0-alpha unlocks the migration Commit action after staged
data passes the checklist and pre-commit audit.

---

## Changed

* The local commit guard now verifies upload manifest staging, account staging,
  transaction staging, and pre-commit audit readiness.
* The Commit button enables only when the checklist is ready and the migration
  draft is still validated.
* `commit_migration_draft` now repeats commit-time safety checks in Supabase.

---

## Safety

* Commit is still explicit; it does not run automatically.
* Remote CRUD and automatic sync remain disabled.
* Supabase rejects commit if staged counts or account links no longer match the
  checkpoint.
