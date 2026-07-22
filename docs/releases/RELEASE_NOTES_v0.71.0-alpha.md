# Home Finance OS v0.71.0-alpha

## Household Claim Result Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 71

---

## Overview

Home Finance OS v0.71.0-alpha adds a fail-closed ownership check to Supabase
household claim results.

After the claim RPC returns, the adapter now verifies the returned `user_id`
matches the current signed-in user before accepting the membership and migration
draft payload.

---

## Added

* Added a household claim result ownership check.
* Rejected household claim RPC results that belong to another user.
* Updated the successful claim fixture to match the signed-in user.
* Added a mismatched-user claim result test.

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
* Verified `npm.cmd test` completes with forty-seven passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed mismatched household claim user results fail closed.
