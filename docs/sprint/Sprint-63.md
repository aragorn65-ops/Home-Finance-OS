# Home Finance OS Sprint 63

## Migration Commit Local-Link Guard

**Release:** v0.63.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-63-migration-commit-local-link-guard
**Status:** Complete

---

## Sprint Objective

Sprint 63 blocks remote migration commit when the local checkpoint draft needed
for local household linking is no longer available.

The sprint still does not import records, sync remote data, delete local browser
data, or migrate production households.

---

## Planned Scope

* [x] Require the local migration checkpoint draft before calling remote commit.
* [x] Keep local household linking explicit after remote commit succeeds.
* [x] Surface a refresh-before-commit error when the local checkpoint is stale.
* [x] Add focused tests for the local commit precondition.

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
* Verified `npm.cmd test` completes with thirty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified missing local checkpoint state blocks commit before the remote RPC.
