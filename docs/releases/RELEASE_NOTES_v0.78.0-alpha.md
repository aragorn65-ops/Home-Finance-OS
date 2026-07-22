# Home Finance OS v0.78.0-alpha

## Backup Summary Link-Status Guard

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 78

---

## Overview

Home Finance OS v0.78.0-alpha hardens backup summary validation for
authenticated household links.

Backup summaries that claim to be linked now need a non-empty remote household
id, and unlinked summaries cannot carry remote household ids.

---

## Added

* Added consistency validation for backup summary link metadata.
* Covered ordinary backup summaries with blank linked remote household ids.
* Covered password-protected backup preview summaries with blank linked remote
  household ids.

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
* Verified `npm.cmd test` completes with fifty-nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed contradictory linked backup summary metadata is rejected before
  restore.
