# Home Finance OS v0.63.0-alpha

## Migration Commit Local-Link Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 63

---

## Overview

Home Finance OS v0.63.0-alpha hardens the migration commit path by requiring
the local checkpoint draft before a remote commit is attempted.

This prevents a stale diagnostics state from committing remote persistence while
skipping the local household link.

---

## Added

* Added a local checkpoint precondition before remote migration commit.
* Added a clear refresh-before-commit error for stale local checkpoint state.
* Added focused tests for the local commit precondition.

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
* Verified `npm.cmd test` completes with thirty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed missing local checkpoint state blocks commit before the remote RPC.
