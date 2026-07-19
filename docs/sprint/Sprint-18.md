# Home Finance OS Sprint 18

## Google Drive Restore

**Release:** v0.18.0-alpha
**Date:** July 18, 2026
**Branch:** sprint-18-google-drive-restore
**Status:** Closed

---

## Sprint Objective

Sprint 18 should complete the first practical Google Drive backup loop by adding a restore path from Drive.

Sprint 17 added local package health, richer backup metadata, and optional Save to Google Drive. Sprint 18 should let a user find HFOS backup files created by the app, preview the selected cloud backup, and restore it through the same validated, rollback-protected restore pipeline used by local import.

---

## Planned Scope

Sprint 18 candidates include:

* Add a Google Drive backup file discovery adapter using the existing Google Identity Services token flow.
* Add a Settings action for browsing recent HFOS backups saved by the app.
* Show Drive backup metadata before restore.
* Download the selected Drive backup JSON and validate it before confirmation.
* Reuse the existing local restore confirmation, validation, rollback, and reload behavior.
* Keep local Import Backup available as the offline fallback.
* Update HOW_TO_USE and release notes with Drive restore guidance.

---

## Google Drive Restore Rules

Restore from Drive should:

* Require `VITE_GOOGLE_CLIENT_ID`.
* Request only the Drive scope needed for app-created files.
* List only HFOS backup JSON files visible to the app.
* Preview household name, export date, package version, schema version, theme preference, and record counts before restore.
* Validate the downloaded backup before showing restore confirmation.
* Restore all-or-nothing using the existing rollback-protected local restore path.

Restore from Drive should not:

* Merge cloud data with current browser data.
* Recompute historical currency fields.
* Delete Drive files.
* Auto-sync in the background.
* Replace user authentication or future server-side authorization.

Implemented:

* Added Google Drive backup discovery for recent app-visible HFOS backup JSON files.
* Added a Settings Restore from Google Drive action.
* Downloaded selected Drive backups and validated them before showing restore confirmation.
* Reused the existing rollback-protected local restore confirmation and reload flow after Drive backup selection.
* Reused the short-lived Google Drive access token in memory so listing and selecting a backup behave like one restore session.
* Added a clear empty state when no app-visible Google Drive backups are found.
* Updated the Dashboard remittance calculator to exclude outstanding settlements and round the ballpark estimate up to the next 100.
* Surfaced Google Drive API rejection status and message details in Settings alerts to make OAuth and API setup failures easier to diagnose.
* Clarified that Drive restore lists only low-permission app-visible backups; manually uploaded Drive files should be downloaded and restored with Import Backup.
* Fixed utility bill saves after restore by giving utility-generated expense transactions the household base currency and a locked exchange rate of 1.
* Added settlement transfer receipt attachments with upload, paste screenshot, preview, validation, persistence, backup, and restore support.

---

## Deferred

* Auto-backup scheduling.
* Cross-device conflict resolution.
* User authentication.
* Server-side authorization.
* Encrypted backup files.
* Full multi-device sync.

---

## Verification Targets

Sprint 18 should verify:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Manual QA should include:

* Confirm Drive restore is disabled or clearly explained when `VITE_GOOGLE_CLIENT_ID` is missing.
* Confirm Drive backup listing requires Google consent.
* Confirm Drive backup listing shows app-created HFOS backup files.
* Confirm selecting a Drive backup shows validated package metadata before restore.
* Confirm restoring a Drive backup reloads the app and hydrates restored local data.
* Confirm invalid or malformed Drive backup files are rejected.
* Confirm local Import Backup still works.
* Confirm Settings controls remain usable on mobile widths.

---

## Sprint Result

Sprint 18 closed on July 18, 2026. Google Drive backup and restore now complete the first manual cloud backup loop: HFOS can save a validated backup to Drive, discover app-visible Drive backups, download and validate a selected backup, preview the package, and restore it through the existing all-or-nothing local restore path.

Manual QA confirmed:

* Save to Google Drive works with the configured OAuth client and Drive API.
* Restore from Google Drive lists HFOS-created backups.
* Selecting a Drive backup shows the validated restore preview.
* Restoring from Drive hydrates browser-local household data in a fresh/private browser session.
* Manually copied Drive files remain supported through Import Backup after downloading them from Drive.
* Mobile Settings layout remains usable for the Data & Backup flow.
* Post-restore settlement records can store transfer receipt proof files.
