# Home Finance OS Sprint 57

## Supabase Migration Lifecycle Timestamps

**Release:** v0.57.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-57-supabase-lifecycle-timestamps
**Status:** Complete

---

## Sprint Objective

Sprint 57 makes disposable-project migration lifecycle timestamps durable so
validated, committed, and aborted draft states remain observable after a
refresh.

The sprint still does not import records, sync remote data, delete local browser
data, or migrate production households.

---

## Planned Scope

* [x] Add `validated_at`, `committed_at`, and `aborted_at` columns to
      `migration_drafts`.
* [x] Keep the schema re-runnable with `add column if not exists`.
* [x] Persist lifecycle timestamps from validation, commit, and abort RPCs.
* [x] Select lifecycle timestamps when reading Supabase migration drafts.
* [x] Map lifecycle timestamps into the existing remote migration draft model.
* [x] Add focused test coverage for lifecycle timestamp mapping.

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
* Verified `npm.cmd test` completes with twenty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified migration draft diagnostics preserve lifecycle timestamps.
