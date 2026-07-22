# Home Finance OS v0.48.0-alpha

## Supabase Account Diagnostics

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 48

---

## Overview

Home Finance OS v0.48.0-alpha adds read-only, aggregate-only Supabase account
diagnostics for disposable-project RLS verification.

Account names, balances, account writes, remote CRUD, sync, and real migration
remain disabled.

---

## Added

* Added aggregate-only Supabase account diagnostics by membership household id.
* Added account visibility, class, activity, and currency counts to Auth
  Diagnostics.
* Added tests for account diagnostics query shape, id deduplication, and
  aggregate output.

---

## Deferred

* Account names and balances in diagnostics.
* Account writes.
* Remote CRUD and sync.
* Real data migration.
* Production account management UI.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with fourteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed account diagnostics remain aggregate-only and read-only.
* Confirmed account names and balances are not selected or rendered.
