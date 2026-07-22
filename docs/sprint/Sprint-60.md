# Home Finance OS Sprint 60

## Migration Checkpoint Ordering

**Release:** v0.60.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-60-migration-checkpoint-ordering
**Status:** Complete

---

## Sprint Objective

Sprint 60 makes the migration checkpoint panel order drafts by newest lifecycle
activity instead of adapter return order.

The sprint is diagnostics-only. It still does not import records, sync remote
data, delete local browser data, or migrate production households.

---

## Planned Scope

* [x] Add lifecycle-aware checkpoint sorting.
* [x] Prefer aborted, committed, and validated timestamps before falling back to
      `updatedAt`.
* [x] Show newest migration checkpoint activity first in the panel.
* [x] Add focused test coverage for checkpoint ordering.

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
* Verified `npm.cmd test` completes with twenty-nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified checkpoint ordering does not depend on adapter return order.
