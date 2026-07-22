# Home Finance OS v0.64.0-alpha

## Migration Commit Preconditions

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 64

---

## Overview

Home Finance OS v0.64.0-alpha tightens the local checks before a migration
checkpoint can call remote commit.

A local checkpoint must be validated and include local link metadata before the
remote commit RPC can run.

---

## Added

* Required validated local checkpoint status before commit.
* Required local owner member id and requesting user id before commit.
* Added focused tests for invalid local commit preconditions.

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
* Verified `npm.cmd test` completes with thirty-six passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed non-validated or incomplete local checkpoints block commit.
