# Release Notes v0.95.0-alpha

## Pre-Commit Remote Staging Audit

Home Finance OS v0.95.0-alpha adds a read-only pre-commit audit for staged
Supabase migration data.

---

## Added

* `audit_migration_precommit` checks owned migration drafts before future commit
  unlock work.
* The audit verifies upload, account, and transaction staging lifecycle fields.
* The audit compares staged account and transaction row counts against the
  checkpoint backup summary.
* The audit blocks readiness when staged expense transactions are missing
  source accounts.
* The migration checkpoint panel now exposes an **Audit commit** action.

---

## Safety

* The audit is read-only.
* Commit remains locked.
* Remote CRUD, automatic sync, and live multi-device persistence remain
  disabled.
