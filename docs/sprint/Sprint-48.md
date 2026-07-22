# Home Finance OS Sprint 48

## Supabase Account Diagnostics

**Release:** v0.48.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-48-supabase-account-diagnostics
**Status:** Complete

---

## Sprint Objective

Sprint 48 adds read-only Supabase account diagnostics so disposable-project
testing can verify household-scoped and member-private account visibility
without exposing account names or balances.

The sprint keeps all account writes, remote CRUD, sync, and real migration
behavior disabled.

---

## Planned Scope

* [x] Add aggregate-only Supabase account diagnostics by membership household
      id.
* [x] Count active, inactive, household-visible, private, asset, and liability
      accounts.
* [x] Show available account currencies without showing balances.
* [x] Render the account visibility summary in Auth Diagnostics.
* [x] Add tests for account diagnostics query shape and aggregate output.

---

## Out Of Scope

* Account names in diagnostics.
* Account balances in diagnostics.
* Account writes.
* Remote CRUD or sync.
* Real data migration.
* Production account management UI.

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
* Verified `npm.cmd test` completes with fourteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified account diagnostics remain aggregate-only and read-only.
* Confirmed account names and balances are not selected or rendered.
