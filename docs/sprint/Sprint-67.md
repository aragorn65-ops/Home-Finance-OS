# Home Finance OS Sprint 67

## Migration Abort Disabled Guard

**Release:** v0.67.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-67-migration-abort-disabled-guard
**Status:** Complete

---

## Sprint Objective

Sprint 67 makes disabled or misconfigured migration abort fail closed instead
of returning a silent no-op success.

The sprint still does not import records, sync remote data, delete local browser
data, or migrate production households.

---

## Planned Scope

* [x] Make disabled auth adapter migration abort throw a clear error.
* [x] Make disabled remote migration repository abort throw a clear error.
* [x] Make misconfigured Supabase migration abort throw unavailable config.
* [x] Add focused tests for disabled and misconfigured abort behavior.

---

## Out Of Scope

* Importing full household records.
* Deleting local browser data.
* Remote CRUD or sync.
* Production migration.
* Production Supabase credentials.

---

## Verification Targets

```text
git diff --check
npm.cmd test
npm.cmd run build
```

---

## Verification Results

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with forty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified disabled or misconfigured Abort actions reject instead of no-op.
