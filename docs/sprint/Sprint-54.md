# Home Finance OS Sprint 54

## Supabase Validation RPC

**Release:** v0.54.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-54-supabase-validation-rpc
**Status:** Complete

---

## Sprint Objective

Sprint 54 adds a controlled Supabase validation RPC so disposable-project
migration validation can mark an owned draft as `validated` only after
metadata blockers pass.

The sprint still does not commit, abort, import records, sync, or migrate
production data.

---

## Planned Scope

* [x] Add `validate_migration_draft_metadata` to the disposable Supabase spike
      schema.
* [x] Scope the RPC to the signed-in draft owner.
* [x] Keep validation status updates behind the RPC instead of broad table
      update policies.
* [x] Call the RPC only when metadata validation has no blockers.
* [x] Add tests for RPC payloads and blocked-draft no-op behavior.

---

## Out Of Scope

* Migration commit or abort.
* Importing full household records.
* Reading `backup_summary` or `validation_summary` in the browser.
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
* Verified `npm.cmd test` completes with twenty passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified the validation RPC runs only after metadata blockers pass.
* Verified blocked draft metadata does not call the validation RPC.
