# Home Finance OS v0.47.0-alpha

## Supabase Household Diagnostics

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 47

---

## Overview

Home Finance OS v0.47.0-alpha enriches read-only Supabase membership
diagnostics with household names for disposable-project verification.

Production household management, household writes, remote CRUD, and real
migration remain disabled.

---

## Added

* Added read-only Supabase household diagnostics lookup by membership household
  id.
* Added household-name enrichment to Auth Diagnostics membership summaries.
* Added tests for household diagnostics query shape, id deduplication, and
  active-row filtering.

---

## Deferred

* Household writes.
* Household claims and invites against Supabase.
* Remote CRUD and sync.
* Real household migration.
* Production household management UI.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with thirteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed household diagnostics remain read-only and diagnostics-only.
