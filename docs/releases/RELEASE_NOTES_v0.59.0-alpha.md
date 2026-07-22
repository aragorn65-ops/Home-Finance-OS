# Home Finance OS v0.59.0-alpha

## Latest Migration Diagnostics

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 59

---

## Overview

Home Finance OS v0.59.0-alpha makes latest migration diagnostics deterministic.

Auth Diagnostics now chooses the latest migration checkpoint by lifecycle
timestamp instead of relying on the order returned by the adapter. It also shows
the selected checkpoint timestamp as a stable UTC diagnostic value.

---

## Added

* Added lifecycle-aware latest migration selection.
* Added latest migration timestamp output to Auth Diagnostics.
* Added tests for unordered draft selection and diagnostic timestamp precedence.

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
* Verified `npm.cmd test` completes with twenty-eight passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed Auth Diagnostics uses the newest lifecycle timestamp instead of
  adapter return order.
