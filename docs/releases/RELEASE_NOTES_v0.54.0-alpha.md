# Home Finance OS v0.54.0-alpha

## Supabase Validation RPC

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 54

---

## Overview

Home Finance OS v0.54.0-alpha adds a controlled Supabase validation RPC for
disposable-project migration testing.

Validation can now mark an owned draft as `validated` after metadata blockers
pass. Commit, abort, record import, sync, and production migration remain
disabled.

---

## Added

* Added `validate_migration_draft_metadata` to the disposable Supabase spike
  schema.
* Wired Supabase migration validation to call the RPC only after metadata
  blockers pass.
* Added tests for validation RPC payloads and blocked-draft no-op behavior.

---

## Deferred

* Migration commit or abort.
* Importing full household records.
* Reading `backup_summary` or `validation_summary` in the browser.
* Remote CRUD and sync.
* Production migration.
* General client-side update policies.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with twenty passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed the validation RPC runs only after metadata blockers pass.
* Confirmed blocked draft metadata does not call the validation RPC.
