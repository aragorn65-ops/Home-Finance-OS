# Home Finance OS v0.34.0-alpha

## Storage And Auth Tests

**Release Date:** July 21, 2026
**Status:** Complete
**Sprint:** Sprint 34

---

## Overview

Home Finance OS v0.34.0-alpha adds the first focused automated test harness for beta-hardening work.

The tests cover local household link storage, backup linked-state summaries, backup validation, and prototype migration commit behavior.

---

## Highlights

* Added `npm.cmd test`.
* Added a Node test runner setup for TypeScript service tests.
* Added in-memory browser storage helpers for localStorage-backed services.
* Added tests for linked household loading.
* Added tests for linking the local owner member after migration commit.
* Added tests for linked backup summaries and malformed authenticated-link validation.
* Added tests for prototype claim, validate, and commit behavior.

---

## Deferred

* Component-level tests.
* Full browser end-to-end test framework.
* Broader coverage for every repository and finance workflow.
