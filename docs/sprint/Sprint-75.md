# Home Finance OS Sprint 75

## Migration Commit Existing Link Guard

**Release:** v0.75.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-75-migration-commit-existing-link-guard
**Status:** Complete

---

## Sprint Objective

Sprint 75 prevents remote migration commit from running when the local
household already has an authenticated link for a different remote checkpoint.

This protects existing local link state from being overwritten after remote
persistence has already committed.

The sprint still does not import records, sync remote data, delete local browser
data, or migrate production households.

---

## Planned Scope

* [x] Add a reusable existing-link preflight for migration commit.
* [x] Allow commit when the local household has no authenticated link.
* [x] Allow commit when the existing link matches the checkpoint.
* [x] Block commit when the existing link points elsewhere.

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
* Verified `npm.cmd test` completes with fifty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified remote commit is not called when local authenticated link state
  conflicts with the checkpoint.
