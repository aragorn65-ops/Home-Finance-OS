# Home Finance OS Sprint 55

## Supabase Abort RPC

**Release:** v0.55.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-55-supabase-abort-rpc
**Status:** Complete

---

## Sprint Objective

Sprint 55 adds a controlled Supabase abort RPC so disposable-project migration
drafts can be marked `aborted` by their owner without deleting local browser
data or importing records.

The sprint still does not commit, import records, sync, or migrate production
data.

---

## Planned Scope

* [x] Add `abort_migration_draft` to the disposable Supabase spike schema.
* [x] Scope the RPC to the signed-in draft owner.
* [x] Block aborting committed drafts.
* [x] Wire `SupabaseAuthBackendAdapter.abortMigrationDraft` through the RPC.
* [x] Add tests for successful abort payloads and Supabase rejection handling.

---

## Out Of Scope

* Migration commit.
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
* Verified `npm.cmd test` completes with twenty-two passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified abort uses the explicit Supabase RPC.
* Verified Supabase abort rejections are surfaced clearly.
