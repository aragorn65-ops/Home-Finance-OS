# Sprint 101

## Cloud Restore Preview

**Branch:** main

---

## Intent

Sprint 101 adds a read-only cloud restore preview for committed Supabase
migration checkpoints.

The goal is to show the household, account count, transaction count,
currencies, date range, and restore-readiness checks that a future restore path
would use, while keeping browser restore, remote CRUD, and automatic sync
disabled.

---

## Planned Scope

* [x] Add a Cloud Restore Preview section under Auth Diagnostics.
* [x] Summarize committed remote household, account, transaction, currency, and
  date-range data.
* [x] Reuse post-commit readback evidence instead of writing new remote data.
* [x] Keep the preview blocked until a committed checkpoint exists.
* [x] Keep restore and automatic sync out of scope.

---

## Out Of Scope

* Browser restore from Supabase.
* Remote CRUD.
* Automatic multi-device sync.
* Conflict resolution.
* Additional migration domains.

---

## Verification Targets

* `npm test`
* `npm run build`
* Production Auth Diagnostics shows Cloud Restore Preview checks after a
  committed checkpoint.
