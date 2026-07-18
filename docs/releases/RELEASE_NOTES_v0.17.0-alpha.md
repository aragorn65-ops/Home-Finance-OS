# Home Finance OS v0.17.0-alpha

## Cloud Sync Readiness

**Release Date:** TBD
**Status:** In Progress
**Sprint:** Sprint 17

---

## Overview

Home Finance OS v0.17.0-alpha focuses on preparing the local data package for future Google Drive, cloud sync, and authenticated persistence.

This release should keep HFOS browser-local while making exported data easier to validate, inspect, and eventually move through a cloud adapter.

---

## Planned Highlights

* Define a clearer sync package manifest for local HFOS data.
* Improve visibility into current browser-local data health.
* Reuse local backup validation from Sprint 16 where possible.
* Keep restore all-or-nothing and rollback protected.
* Keep Google Drive, login, and cross-device sync deferred until the package contract is stable.

---

## Package Rules

* Package metadata should identify the household.
* Package metadata should include export date and storage schema version.
* Package metadata should include record counts per collection.
* Package validation should run offline.
* Restore should not merge partial data.
* Restore should not recompute historical currency fields.

---

## Deferred

* Google Drive backup.
* Auto-backup.
* Cross-device conflict resolution.
* Authentication.
* Server-side authorization.
* Encrypted backups.

---

## Manual QA Focus

Before finalizing this alpha, manually verify:

* Settings data health or package metadata matches current browser data.
* Exported backup details match the app preview.
* Valid backup restore works after Clear Test Data.
* Invalid JSON restore shows a clear error.
* Non-HFOS JSON restore shows a clear error.
* Failed restore attempts do not alter current browser data.
* Settings controls remain usable on mobile widths.
