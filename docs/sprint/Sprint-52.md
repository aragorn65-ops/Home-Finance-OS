# Home Finance OS Sprint 52

## Supabase Household Claim RPC

**Release:** v0.52.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-52-supabase-household-claim-rpc
**Status:** Complete

---

## Sprint Objective

Sprint 52 adds the first controlled Supabase write path for disposable-project
validation: an explicit household-claim RPC that creates the remote household,
owner member, owner membership, and uploaded migration draft together.

The sprint does not add broad table writes, remote CRUD, sync, validation,
commit, abort, or production migration behavior.

---

## Planned Scope

* [x] Add a disposable-project `claim_household_from_backup` Supabase RPC to
      the spike schema.
* [x] Keep direct insert/update table policies closed.
* [x] Wire `SupabaseAuthBackendAdapter.createHouseholdClaimDraft` through the
      RPC.
* [x] Map the RPC result into the existing `HouseholdClaimResult` shape.
* [x] Add tests for RPC name, payload shape, returned membership, returned
      migration draft, and remote record count.

---

## Out Of Scope

* Production migration.
* Migration validation, commit, or abort.
* Remote CRUD or sync.
* Household invite flows.
* General client-side insert/update table policies.
* Importing full household records.

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
* Verified `npm.cmd test` completes with eighteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified the claim path uses the explicit Supabase RPC rather than broad
  table writes.
