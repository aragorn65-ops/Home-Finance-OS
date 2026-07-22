# Home Finance OS Sprint 47

## Supabase Household Diagnostics

**Release:** v0.47.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-47-supabase-household-diagnostics
**Status:** Complete

---

## Sprint Objective

Sprint 47 enriches Supabase membership diagnostics with read-only household
names from RLS-protected `households` reads.

The sprint keeps all Supabase household writes, claims, invites, remote CRUD,
and real migration behavior disabled.

---

## Planned Scope

* [x] Add read-only Supabase household diagnostics lookup by membership
      household id.
* [x] Dedupe requested household ids before querying Supabase.
* [x] Filter household diagnostics to active household rows.
* [x] Show household names in the Auth Diagnostics membership summary when
      available.
* [x] Add tests for household diagnostics query shape and filtering.

---

## Out Of Scope

* Household writes.
* Household claims or invites against Supabase.
* Remote CRUD or sync.
* Real household migration.
* Production household management UI.

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
* Verified `npm.cmd test` completes with thirteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified household diagnostics dedupe requested ids and filter to active
  household rows.
* Confirmed household diagnostics remain read-only.
