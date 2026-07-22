# Home Finance OS v0.70.0-alpha

## Household Claim Sign-In Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 70

---

## Overview

Home Finance OS v0.70.0-alpha adds an explicit identity preflight before the
Supabase household claim write.

Signed-out users now receive a clear sign-in error before household claim can
call the remote RPC that creates the household, owner membership, and migration
draft.

---

## Added

* Required a signed-in user before Supabase household claim RPC calls.
* Added a signed-out guard test proving household claim does not call RPCs.
* Kept the successful household claim RPC test explicitly signed in.
* Shared the Supabase backup summary fixture across claim tests.

---

## Deferred

* Importing full household records.
* Deleting local browser data.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with forty-six passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed signed-out household claim stops before remote writes.
