# Home Finance OS Sprint 70

## Household Claim Sign-In Guard

**Release:** v0.70.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-70-household-claim-signin-guard
**Status:** Complete

---

## Sprint Objective

Sprint 70 prevents signed-out Supabase users from reaching the household claim
RPC.

Household claim creates the remote household, owner membership, and migration
draft, so it now requires a current authenticated user before any remote write
can start.

The sprint still does not import records, sync remote data, delete local browser
data, or migrate production households.

---

## Planned Scope

* [x] Require a signed-in user before Supabase household claim RPC calls.
* [x] Keep the household claim success test explicitly signed in.
* [x] Add a focused signed-out test proving the claim RPC is not called.
* [x] Share the Supabase backup summary fixture in claim tests.

---

## Out Of Scope

* Importing full household records.
* Deleting local browser data.
* Remote CRUD or sync.
* Production migration.
* Production Supabase credentials.

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
* Verified `npm.cmd test` completes with forty-six passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified signed-out household claim stops before remote writes.
