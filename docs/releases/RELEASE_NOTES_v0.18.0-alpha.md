# Home Finance OS v0.18.0-alpha

## Google Drive Restore

**Release Date:** July 18, 2026
**Status:** Ready
**Sprint:** Sprint 18

---

## Overview

Home Finance OS v0.18.0-alpha focuses on restoring validated HFOS backup files from Google Drive.

Sprint 17 added optional Drive backup upload. This release should complete the first manual cloud backup loop by letting users find, preview, and restore Drive backups through the same all-or-nothing local restore pipeline.

---

## Planned Highlights

* Add Google Drive backup discovery for HFOS backup files.
* Add a Settings restore-from-Drive action.
* Preview cloud backup package metadata before restore.
* Validate downloaded Drive backup JSON before confirmation.
* Reuse local restore rollback protection and app reload behavior.
* Keep local Import Backup as the offline fallback.

---

## Implemented

* Added Google Drive backup discovery for recent app-visible HFOS backup JSON files.
* Added a Settings Restore from Google Drive action.
* Downloaded selected Drive backups and validated them before showing restore confirmation.
* Reused the existing rollback-protected local restore confirmation and reload flow after Drive backup selection.
* Reused the short-lived Google Drive access token in memory so listing and selecting a backup behave like one restore session.
* Added a clear empty state when no app-visible Google Drive backups are found.
* Updated the Dashboard remittance calculator to exclude outstanding settlements and round the ballpark estimate up to the next 100.
* Surfaced Google Drive API rejection status and message details in Settings alerts to make OAuth and API setup failures easier to diagnose.
* Clarified that Drive restore lists only low-permission app-visible backups; manually uploaded Drive files should be downloaded and restored with Import Backup.

---

## Restore Rules

* Drive restore should require `VITE_GOOGLE_CLIENT_ID`.
* Drive restore should request only app-created-file access.
* Drive restore should list HFOS backup JSON files visible to the app.
* Drive restore should validate before replacing current browser data.
* Drive restore should not merge records.
* Drive restore should not recompute historical currency fields.

---

## Deferred

* Auto-backup.
* Cross-device conflict resolution.
* Authentication.
* Server-side authorization.
* Encrypted backups.
* Full multi-device sync.

---

## Manual QA Focus

Manual QA verified:

* Drive restore is disabled or clearly explained when `VITE_GOOGLE_CLIENT_ID` is missing.
* Drive backup listing requires Google consent.
* Drive backup listing shows app-created HFOS backup files.
* Selecting a Drive backup shows validated package metadata before restore.
* Restoring a Drive backup reloads the app and hydrates restored local data.
* Manually copied Drive backups are restored through local Import Backup after downloading from Drive.
* Local Import Backup still works.
* Settings controls remain usable on mobile widths.
