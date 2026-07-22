# Home Finance OS v0.46.0-alpha

## Supabase Membership Diagnostics

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 46

---

## Overview

Home Finance OS v0.46.0-alpha adds a read-only Auth Diagnostics membership
summary for disposable Supabase project testing.

Production household management, membership writes, remote CRUD, and real
migration remain disabled.

---

## Added

* Added diagnostics-safe membership summaries containing household id, member
  id, role, and status.
* Added membership summaries to Auth Diagnostics output.
* Added read-only membership summary rendering in the Auth Diagnostics panel.

---

## Deferred

* Membership writes.
* Household claims and invites against Supabase.
* Remote CRUD and sync.
* Real household migration.
* Production household management UI.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with twelve passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed membership diagnostics remain read-only.
