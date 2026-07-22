# Home Finance OS v0.75.0-alpha

## Migration Commit Existing Link Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 75

---

## Overview

Home Finance OS v0.75.0-alpha adds a local authenticated-link preflight before
migration commit can call the remote commit RPC.

Commit now allows unlinked households and matching existing checkpoint links,
but blocks local households already linked to a different remote checkpoint.

---

## Added

* Added a reusable existing-link check for migration commit.
* Wired the checkpoint panel to run the existing-link check before remote
  commit.
* Added tests for unlinked, matching-link, and conflicting-link cases.
* Kept existing local owner and remote commit result checks unchanged.

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
* Verified `npm.cmd test` completes with fifty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed remote commit is not called when local authenticated-link state
  conflicts with the checkpoint.
