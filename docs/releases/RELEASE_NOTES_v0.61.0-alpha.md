# Home Finance OS v0.61.0-alpha

## Supabase Spike QA Runbook

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 61

---

## Overview

Home Finance OS v0.61.0-alpha clarifies how to validate the disposable Supabase
spike without involving production household data.

The runbook now covers migration checkpoint lifecycle diagnostics, ordering,
latest migration expectations, and cross-user RLS checks.

---

## Added

* Expanded disposable Supabase validation notes.
* Added checkpoint UI checks for uploaded, validated, committed, and aborted
  states.
* Added lifecycle timestamp and ordering expectations.
* Added cross-user RLS checks for household and migration checkpoint
  visibility.
* Clarified that Cloudflare/private beta smoke testing remains local-first.

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
* Verified `npm.cmd test` completes with twenty-nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed the QA docs keep production data and Supabase spike validation
  separated.
