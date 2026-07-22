# Home Finance OS v0.58.0-alpha

## Migration Lifecycle Diagnostics UI

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 58

---

## Overview

Home Finance OS v0.58.0-alpha makes Supabase migration lifecycle timestamps
visible in the migration checkpoint diagnostics panel.

Validated, committed, and aborted timestamps now appear when present, formatted
as stable UTC diagnostic values. Missing timestamps stay hidden so uploaded
drafts remain uncluttered.

---

## Added

* Added lifecycle timestamp rows to migration checkpoint diagnostics.
* Added a deterministic UTC formatter for checkpoint lifecycle timestamps.
* Added focused tests for timestamp formatting and present-only entry mapping.

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
* Verified `npm.cmd test` completes with twenty-six passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed migration checkpoint timestamps render as deterministic UTC
  diagnostic values.
