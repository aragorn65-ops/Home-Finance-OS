# Home Finance OS v0.73.0-alpha

## Household Claim Membership Result Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 73

---

## Overview

Home Finance OS v0.73.0-alpha adds fail-closed validation to the membership
payload returned by Supabase household claim.

The adapter now rejects claim membership results that are missing required ids
before creating local authenticated membership state.

---

## Added

* Validated household id, membership id, user id, and member id before mapping
  claim memberships.
* Kept role and membership status validation in the same claim mapper.
* Added a focused invalid claim membership id test.
* Preserved general membership diagnostics mapping behavior.

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
* Verified `npm.cmd test` completes with forty-nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed malformed household claim membership results fail closed.
