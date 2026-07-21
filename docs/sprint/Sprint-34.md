# Home Finance OS Sprint 34

## Storage And Auth Tests

**Release:** v0.34.0-alpha
**Date:** TBD
**Branch:** sprint-34-storage-auth-tests
**Status:** Planned

---

## Sprint Objective

Sprint 34 adds focused automated coverage around the riskiest beta-readiness paths.

The sprint should prioritize storage migration, household loading, backup data shape, auth diagnostics, household claim, migration checkpoint, and local authenticated-link behavior.

---

## Planned Scope

* [ ] Add tests for loading legacy, unlinked, and linked household records.
* [ ] Add tests for preserving authenticated-link metadata through serialization.
* [ ] Add tests for linking the local owner member after migration commit.
* [ ] Add tests for auth diagnostics migration and local-link status.
* [ ] Add tests for disabled auth adapters returning safe empty migration state.
* [ ] Add smoke tests for claim, validate, commit, and abort prototype flows where practical.

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
git diff --check
```
