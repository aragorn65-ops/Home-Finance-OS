# Home Finance OS v0.51.0-alpha

## Auth Diagnostics Fail-Soft

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 51

---

## Overview

Home Finance OS v0.51.0-alpha hardens Auth Diagnostics so disposable Supabase
read failures surface as warnings instead of hiding the whole diagnostics
panel.

Supabase writes, remote CRUD, sync, and real migration remain disabled.

---

## Added

* Added warning collection to Auth Diagnostics.
* Added fail-soft handling for diagnostics reads.
* Added warning rendering in the Auth Diagnostics panel.
* Added an adapter-injected diagnostics service seam for focused tests.

---

## Changed

* Hardened auth config imports for non-Vite test tooling.

---

## Deferred

* Retry behavior for failed Supabase diagnostics reads.
* Persistent diagnostics warning history.
* Broad error telemetry.
* Supabase writes.
* Remote CRUD and sync.
* Real data migration.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with seventeen passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed optional Supabase diagnostics failures produce warnings while core
  provider/session status remains visible.
