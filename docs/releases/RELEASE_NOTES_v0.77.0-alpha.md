# Home Finance OS v0.77.0-alpha

## Backup Authenticated Link Field Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 77

---

## Overview

Home Finance OS v0.77.0-alpha hardens backup restore validation for
authenticated household links.

Backups with authenticated-link metadata now must include non-empty required
identifiers before restore can proceed.

---

## Added

* Added non-empty validation for backup authenticated-link identifiers.
* Preserved malformed authenticated-link date rejection.
* Added a focused test for blank remote household ids in backup metadata.

---

## Deferred

* Importing full household records from cloud storage.
* Deleting local browser data.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with fifty-seven passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed blank authenticated-link identifiers are rejected before restore.
