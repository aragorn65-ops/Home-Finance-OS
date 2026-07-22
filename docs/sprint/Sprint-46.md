# Home Finance OS Sprint 46

## Supabase Membership Diagnostics

**Release:** v0.46.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-46-supabase-membership-diagnostics
**Status:** Complete

---

## Sprint Objective

Sprint 46 exposes read-only Supabase membership results in Auth Diagnostics so
disposable-project testers can confirm household id, member id, role, and
status returned by RLS-protected membership reads.

The sprint must not add production household management, membership writes,
remote CRUD, or real migration behavior.

---

## Planned Scope

* [x] Add a diagnostics-safe membership summary model.
* [x] Include mapped membership summaries in auth diagnostics.
* [x] Render membership summaries in the Auth Diagnostics panel.
* [x] Keep the summary read-only and limited to household id, member id, role,
      and status.

---

## Out Of Scope

* Membership writes.
* Household claim or invite UI.
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
* Verified `npm.cmd test` completes with twelve passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed membership diagnostics remain read-only and limited to household
  id, member id, role, and status.
