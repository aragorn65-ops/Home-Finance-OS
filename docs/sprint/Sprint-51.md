# Home Finance OS Sprint 51

## Auth Diagnostics Fail-Soft

**Release:** v0.51.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-51-auth-diagnostics-fail-soft
**Status:** Complete

---

## Sprint Objective

Sprint 51 hardens Auth Diagnostics so disposable Supabase read failures do not
hide the whole diagnostics panel.

The sprint keeps the Supabase path diagnostics-only and does not add writes,
remote CRUD, sync, or real migration behavior.

---

## Planned Scope

* [x] Add warning collection to Auth Diagnostics.
* [x] Fail softly for session, membership, invitation, migration, household,
      account, and transaction diagnostics reads.
* [x] Render diagnostics warnings in the Auth Diagnostics panel.
* [x] Export a small adapter-injected diagnostics service seam for focused
      tests.
* [x] Harden auth config imports for non-Vite test tooling.

---

## Out Of Scope

* Retrying failed Supabase reads.
* Persisting diagnostics warnings.
* Broad error telemetry.
* Supabase writes.
* Remote CRUD or sync.
* Real data migration.

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
* Verified `npm.cmd test` completes with seventeen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified optional Supabase diagnostics failures produce warnings while core
  provider/session status remains visible.
