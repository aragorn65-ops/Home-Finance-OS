# Home Finance OS v0.57.0-alpha

## Supabase Migration Lifecycle Timestamps

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 57

---

## Overview

Home Finance OS v0.57.0-alpha makes Supabase migration lifecycle timestamps
durable in the disposable-project spike.

Migration draft validation, commit, and abort now persist their timestamps on
the draft row, and draft diagnostics map those values back into the existing
remote migration model after refresh.

---

## Added

* Added `validated_at`, `committed_at`, and `aborted_at` columns to the
  disposable Supabase migration draft schema.
* Updated validation, commit, and abort RPCs to persist lifecycle timestamps.
* Updated Supabase migration draft reads to select lifecycle timestamps.
* Added test coverage proving lifecycle timestamps are mapped into diagnostics.

---

## Deferred

* Importing full household records.
* Deleting local browser data.
* Remote CRUD and sync.
* Production migration.
* General client-side update policies.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with twenty-four passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed migration draft diagnostics preserve lifecycle timestamps.
