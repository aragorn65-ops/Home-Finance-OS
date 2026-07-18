# Home Finance OS v0.18.0-alpha

## Google Drive Restore

**Release Date:** TBD
**Status:** In Progress
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

Before finalizing this alpha, manually verify:

* Drive restore is disabled or clearly explained when `VITE_GOOGLE_CLIENT_ID` is missing.
* Drive backup listing requires Google consent.
* Drive backup listing shows app-created HFOS backup files.
* Selecting a Drive backup shows validated package metadata before restore.
* Restoring a Drive backup reloads the app and hydrates restored local data.
* Invalid or malformed Drive backup files are rejected.
* Local Import Backup still works.
* Settings controls remain usable on mobile widths.
