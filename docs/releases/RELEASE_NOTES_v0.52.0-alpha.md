# Home Finance OS v0.52.0-alpha

## Supabase Household Claim RPC

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 52

---

## Overview

Home Finance OS v0.52.0-alpha adds the first controlled Supabase household
claim write path for disposable-project validation.

The new path uses one explicit RPC to create a household, owner member, owner
membership, and uploaded migration draft. Broad table writes, production
migration, remote CRUD, sync, validation, commit, and abort remain disabled.

---

## Added

* Added `claim_household_from_backup` to the disposable Supabase spike schema.
* Wired `SupabaseAuthBackendAdapter.createHouseholdClaimDraft` through the RPC.
* Added RPC result mapping into the existing `HouseholdClaimResult` shape.
* Added tests for RPC payload shape and returned claim data.

---

## Deferred

* Production migration.
* Migration validation, commit, or abort.
* Remote CRUD and sync.
* Household invites.
* General client-side insert/update table policies.
* Full household record import.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with eighteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed the claim path uses an explicit RPC rather than broad table writes.
