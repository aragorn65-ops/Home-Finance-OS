# Home Finance OS Sprint 49

## Supabase Transaction Diagnostics

**Release:** v0.49.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-49-supabase-transaction-diagnostics
**Status:** Complete

---

## Sprint Objective

Sprint 49 adds read-only Supabase transaction diagnostics so
disposable-project testing can verify household, participant, and private
transaction visibility without exposing cash-flow details.

The sprint keeps all transaction writes, remote CRUD, sync, and real migration
behavior disabled.

---

## Planned Scope

* [x] Add aggregate-only Supabase transaction diagnostics by membership
      household id.
* [x] Count active, inactive, income, expense, transfer, household-visible,
      participant-visible, and private transactions.
* [x] Show the visible transaction date range without showing amounts,
      categories, descriptions, or account links.
* [x] Render the transaction visibility summary in Auth Diagnostics.
* [x] Add tests for transaction diagnostics query shape and aggregate output.

---

## Out Of Scope

* Transaction amounts in diagnostics.
* Transaction categories or descriptions in diagnostics.
* Source or destination account ids in diagnostics.
* Transaction writes.
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
* Verified `npm.cmd test` completes with fifteen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified transaction diagnostics remain aggregate-only and read-only.
* Confirmed amounts, categories, descriptions, and account ids are not
  selected or rendered.
