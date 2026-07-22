# Home Finance OS v0.60.0-alpha

## Migration Checkpoint Ordering

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 60

---

## Overview

Home Finance OS v0.60.0-alpha makes migration checkpoint diagnostics easier to
scan by showing the newest lifecycle activity first.

Checkpoint ordering now uses lifecycle timestamps instead of adapter return
order, while remaining diagnostics-only.

---

## Added

* Added lifecycle-aware migration checkpoint sorting.
* Wired the migration checkpoint panel to display newest activity first.
* Added test coverage for lifecycle-aware checkpoint ordering.

---

## Deferred

* Importing full household records.
* Deleting local browser data.
* Remote CRUD and sync.
* Production migration.
* General client-side update policies.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with twenty-nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed checkpoint ordering does not depend on adapter return order.
