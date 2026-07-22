# Home Finance OS v0.56.0-alpha

## Supabase Commit RPC

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 56

---

## Overview

Home Finance OS v0.56.0-alpha adds a controlled Supabase commit RPC for
disposable-project migration testing.

Commit can now mark an owned, validated draft as `committed` and return the
draft and household ids needed by the local app link flow. Record import, sync,
local data deletion, and production migration remain disabled.

---

## Added

* Added `commit_migration_draft` to the disposable Supabase spike schema.
* Wired `SupabaseAuthBackendAdapter.commitMigrationDraft` through the RPC.
* Added tests for successful commit payloads and Supabase rejection handling.

---

## Deferred

* Importing full household records.
* Deleting local browser data.
* Remote CRUD and sync.
* Production migration.
* General client-side update policies.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with twenty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed commit uses the explicit Supabase RPC.
* Confirmed Supabase commit rejections are surfaced clearly.
