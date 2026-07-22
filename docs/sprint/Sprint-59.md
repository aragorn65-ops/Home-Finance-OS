# Home Finance OS Sprint 59

## Latest Migration Diagnostics

**Release:** v0.59.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-59-latest-migration-diagnostics
**Status:** Complete

---

## Sprint Objective

Sprint 59 makes Auth Diagnostics choose the latest migration checkpoint by
lifecycle timestamp instead of adapter return order.

The sprint also shows the latest migration timestamp in diagnostics. It still
does not import records, sync remote data, delete local browser data, or migrate
production households.

---

## Planned Scope

* [x] Add lifecycle-aware latest migration selection.
* [x] Prefer aborted, committed, and validated timestamps before falling back to
      `updatedAt`.
* [x] Show the latest migration timestamp in Auth Diagnostics.
* [x] Add focused tests for unordered draft selection and diagnostic date
      precedence.

---

## Out Of Scope

* Importing full household records.
* Deleting local browser data.
* Remote CRUD or sync.
* Production migration.
* General client-side update policies.

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
* Verified `npm.cmd test` completes with twenty-eight passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified Auth Diagnostics uses the newest lifecycle timestamp instead of
  adapter return order.
