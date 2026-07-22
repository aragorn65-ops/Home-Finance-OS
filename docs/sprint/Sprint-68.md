# Home Finance OS Sprint 68

## Migration Lifecycle Disabled Guards

**Release:** v0.68.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-68-migration-action-disabled-guards
**Status:** Complete

---

## Sprint Objective

Sprint 68 makes disabled or misconfigured migration lifecycle actions fail
closed consistently.

Validation now rejects clearly when the remote backend is disabled or
misconfigured, matching commit and abort. Configured-but-signed-out validation
still returns a normal sign-in blocker because the backend itself is available.

The sprint still does not import records, sync remote data, delete local browser
data, or migrate production households.

---

## Planned Scope

* [x] Make disabled auth adapter migration validation throw a clear error.
* [x] Make disabled remote migration repository validation throw a clear error.
* [x] Make misconfigured Supabase migration validation throw unavailable config.
* [x] Add focused tests for disabled validation, commit, and abort behavior.

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
* Verified disabled or misconfigured migration lifecycle actions reject instead
  of returning blocked or no-op success.
