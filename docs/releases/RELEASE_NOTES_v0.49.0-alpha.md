# Home Finance OS v0.49.0-alpha

## Supabase Transaction Diagnostics

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 49

---

## Overview

Home Finance OS v0.49.0-alpha adds read-only, aggregate-only Supabase
transaction diagnostics for disposable-project RLS verification.

Transaction amounts, categories, descriptions, account ids, writes, remote
CRUD, sync, and real migration remain disabled.

---

## Added

* Added aggregate-only Supabase transaction diagnostics by membership household
  id.
* Added transaction visibility, type, activity, and date-range counts to Auth
  Diagnostics.
* Added tests for transaction diagnostics query shape, id deduplication, and
  aggregate output.

---

## Deferred

* Transaction amounts, categories, descriptions, and account ids in
  diagnostics.
* Transaction writes.
* Remote CRUD and sync.
* Real data migration.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with fifteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed transaction diagnostics remain aggregate-only and read-only.
* Confirmed amounts, categories, descriptions, and account ids are not selected
  or rendered.
