# Home Finance OS v0.55.0-alpha

## Supabase Abort RPC

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 55

---

## Overview

Home Finance OS v0.55.0-alpha adds a controlled Supabase abort RPC for
disposable-project migration testing.

Abort can now mark an owned non-committed draft as `aborted`. Commit, record
import, sync, local data deletion, and production migration remain disabled.

---

## Added

* Added `abort_migration_draft` to the disposable Supabase spike schema.
* Wired `SupabaseAuthBackendAdapter.abortMigrationDraft` through the RPC.
* Added tests for successful abort payloads and Supabase rejection handling.

---

## Deferred

* Migration commit.
* Importing full household records.
* Deleting local browser data.
* Remote CRUD and sync.
* Production migration.
* General client-side update policies.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with twenty-two passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed abort uses the explicit Supabase RPC.
* Confirmed Supabase abort rejections are surfaced clearly.
