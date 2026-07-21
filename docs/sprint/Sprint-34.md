# Home Finance OS Sprint 34

## Storage And Auth Tests

**Release:** v0.34.0-alpha
**Date:** July 21, 2026
**Branch:** sprint-34-storage-auth-tests
**Status:** Complete

---

## Sprint Objective

Sprint 34 adds focused automated coverage around the riskiest beta-readiness paths.

The sprint should prioritize storage migration, household loading, backup data shape, auth diagnostics, household claim, migration checkpoint, and local authenticated-link behavior.

---

## Planned Scope

* [x] Add a lightweight test command.
* [x] Add tests for loading linked household records.
* [x] Add tests for preserving authenticated-link metadata through storage loading.
* [x] Add tests for linking the local owner member after migration commit.
* [x] Add tests for backup linked-status summaries.
* [x] Add tests for malformed authenticated-link backup validation.
* [x] Add smoke tests for prototype claim, validate, and commit behavior.

---

## Implementation Summary

* Added `npm.cmd test` using Node's built-in test runner and TypeScript stripping.
* Added a small test resolver hook for Vite-style extensionless app imports.
* Added in-memory browser storage helpers for localStorage-dependent service tests.
* Covered linked household loading and owner-member user linking.
* Covered linked backup summary generation and malformed authenticated-link validation.
* Covered prototype migration draft creation, validation, and commit household-id preservation.

---

## Out Of Scope

* Full end-to-end browser test framework adoption unless already low-cost.
* Production backend contract tests.
* Provider-specific auth or sync tests.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
npm.cmd test
git diff --check
```

All verification targets pass.
