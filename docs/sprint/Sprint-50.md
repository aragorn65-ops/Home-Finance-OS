# Home Finance OS Sprint 50

## Supabase Migration Draft Diagnostics

**Release:** v0.50.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-50-supabase-migration-draft-diagnostics
**Status:** Complete

---

## Sprint Objective

Sprint 50 adds read-only Supabase migration draft diagnostics so
disposable-project testing can verify `migration_drafts` RLS through the
existing Auth Diagnostics migration count and latest status.

The sprint keeps migration draft payloads, validation payloads, writes, commit,
abort, remote CRUD, sync, and real migration behavior disabled.

---

## Planned Scope

* [x] Read Supabase migration draft metadata for the current signed-in user.
* [x] Select only draft metadata needed for diagnostics.
* [x] Keep `backup_summary` and `validation_summary` out of the client query.
* [x] Map Supabase draft rows into the existing remote migration draft model
      with a redacted zero-count backup summary.
* [x] Add tests for query shape, user scoping, status filtering, and redacted
      summary output.

---

## Out Of Scope

* Reading migration backup payloads.
* Reading validation payloads.
* Migration draft creation against Supabase.
* Migration validation, commit, or abort against Supabase.
* Remote CRUD or sync.
* Real data migration.

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
* Verified `npm.cmd test` completes with sixteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified migration draft diagnostics remain read-only.
* Confirmed `backup_summary` and `validation_summary` are not selected.
