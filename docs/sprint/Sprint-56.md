# Home Finance OS Sprint 56

## Supabase Commit RPC

**Release:** v0.56.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-56-supabase-commit-rpc
**Status:** Complete

---

## Sprint Objective

Sprint 56 adds a controlled Supabase commit RPC so disposable-project migration
drafts can be marked `committed` by their owner after validation passes.

The sprint still does not import records, sync remote data, delete local browser
data, or migrate production households.

---

## Planned Scope

* [x] Add `commit_migration_draft` to the disposable Supabase spike schema.
* [x] Scope the RPC to the signed-in draft owner.
* [x] Require the draft to already be `validated`.
* [x] Return the committed draft and linked household ids for local linking.
* [x] Wire `SupabaseAuthBackendAdapter.commitMigrationDraft` through the RPC.
* [x] Add tests for successful commit payloads and Supabase rejection handling.

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
* Verified commit uses the explicit Supabase RPC.
* Verified Supabase commit rejections are surfaced clearly.
