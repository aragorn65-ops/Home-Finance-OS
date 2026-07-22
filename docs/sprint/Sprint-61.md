# Home Finance OS Sprint 61

## Supabase Spike QA Runbook

**Release:** v0.61.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-61-supabase-spike-qa-runbook
**Status:** Complete

---

## Sprint Objective

Sprint 61 turns the disposable Supabase spike checks into a clearer QA runbook
covering lifecycle diagnostics, checkpoint ordering, and cross-user RLS
verification.

The sprint is documentation-only. It does not enable production auth, remote
sync, remote import, local data deletion, or production migration.

---

## Planned Scope

* [x] Expand disposable Supabase setup and validation notes.
* [x] Add migration checkpoint UI checks for uploaded, validated, committed,
      and aborted states.
* [x] Add lifecycle timestamp and ordering expectations.
* [x] Add cross-user RLS checks for household and migration visibility.
* [x] Clarify that normal private beta and Cloudflare smoke checks remain
      local-first.

---

## Out Of Scope

* Importing full household records.
* Deleting local browser data.
* Remote CRUD or sync.
* Production migration.
* Production Supabase credentials.

---

## Verification Targets

```text
git diff --check
npm.cmd test
npm.cmd run build
```

---

## Verification Results

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with twenty-nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified the QA docs keep production data and Supabase spike validation
  separated.
