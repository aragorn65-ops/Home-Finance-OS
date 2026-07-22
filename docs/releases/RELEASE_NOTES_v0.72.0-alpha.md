# Home Finance OS v0.72.0-alpha

## Household Claim Migration Result Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 72

---

## Overview

Home Finance OS v0.72.0-alpha adds fail-closed validation to the migration draft
payload returned by Supabase household claim.

The adapter no longer coerces unknown claim migration statuses to `uploaded`.
Malformed claim migration payloads now reject before local checkpoint state is
created.

---

## Added

* Validated household id, owner member id, migration draft id, and migration
  status before mapping claim migration drafts.
* Rejected invalid household claim migration draft payloads with a clear error.
* Removed fallback coercion of unknown claim migration status to `uploaded`.
* Added a focused invalid claim migration status test.

---

## Deferred

* Importing full household records.
* Deleting local browser data.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with forty-eight passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed malformed household claim migration draft results fail closed.
