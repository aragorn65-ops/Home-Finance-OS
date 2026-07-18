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

## Implemented

* Added a current browser data-health summary in Settings Data & Backup.
* Showed household, storage schema version, theme preference, and collection counts before export.
* Disabled Export Backup when the current browser data is not exportable.
* Added optional Save to Google Drive backup upload when `VITE_GOOGLE_CLIENT_ID` is configured.
* Added a frontend `.env.example` for Google Drive backup configuration.

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

* Google Drive restore picker.
* Auto-backup.
* Cross-device conflict resolution.
* Authentication.
* Server-side authorization.
* Encrypted backups.

---

## Manual QA Focus

Before finalizing this alpha, manually verify:

* Settings data health or package metadata matches current browser data.
* Export Backup is disabled when there is no exportable household data.
* Save to Google Drive explains missing configuration when `VITE_GOOGLE_CLIENT_ID` is not set.
* Save to Google Drive uploads a backup file when a Google OAuth client ID is configured.
* Exported backup details match the app preview.
* Valid backup restore works after Clear Test Data.
* Invalid JSON restore shows a clear error.
* Non-HFOS JSON restore shows a clear error.
* Failed restore attempts do not alter current browser data.
* Settings controls remain usable on mobile widths.
