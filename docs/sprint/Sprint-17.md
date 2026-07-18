# Home Finance OS Sprint 17

## Cloud Sync Readiness

**Release:** v0.17.0-alpha
**Date:** July 18, 2026
**Branch:** sprint-17-cloud-sync-readiness
**Status:** Open

---

## Sprint Objective

Sprint 17 should prepare HFOS for future Google Drive, cloud sync, and authenticated persistence without adding a live cloud dependency yet.

The main goal is to turn the browser-local data model into a clearer, versioned sync package that can be validated, inspected, and eventually uploaded or downloaded by a cloud adapter.

---

## Planned Scope

Sprint 17 candidates include:

* Define a sync manifest that describes the local HFOS data package.
* Reuse Sprint 16 backup export/restore validation where possible.
* Add a Settings-visible data health summary for household, accounts, transactions, settlements, savings, and theme preference.
* Add a dry-run restore or import preview path where useful.
* Add clearer backup file details for manual QA.
* Keep Google Drive, login, and true cross-device sync deferred until the data package is stable.
* Update HOW_TO_USE and release notes with cloud-readiness guidance.

---

## Sync Package Scope

Recommended first slice:

* Keep local `.hfos-backup.json` as the portable package format for now.
* Add or expose enough metadata to answer:
  * Which household is in this package?
  * When was it exported?
  * Which schema version is represented?
  * How many records are included per collection?
  * Which optional local preferences are included?
* Keep validation deterministic and offline.
* Keep restore all-or-nothing.
* Do not upload to third-party storage yet.

Implemented:

* Added a reusable application data-health summary derived from the same storage package used by local backup export.
* Exposed current browser package details in Settings Data & Backup, including household, schema version, theme preference, and collection counts.
* Disabled Export Backup when the current browser data is not exportable.
* Added an optional Google Drive backup action that uploads the same local backup package when `VITE_GOOGLE_CLIENT_ID` is configured.
* Added a frontend `.env.example` documenting the Google OAuth client ID setting.
* Updated the GitHub Pages preview workflow to pass `VITE_GOOGLE_CLIENT_ID` from repository variables or Actions secrets into the Vite build.
* Added a workflow warning when `VITE_GOOGLE_CLIENT_ID` is missing from the build.
* Updated GitHub Pages deploy actions to Node 24-compatible major versions.
* Disabled the Google Drive backup action and showed a setup note when the deployed app has no Google client ID.

---

## Deferred

* Google Drive restore picker.
* Auto-backup scheduling.
* Cross-device conflict resolution.
* User authentication.
* Server-side authorization.
* Encrypted backup files.

---

## Verification Targets

Sprint 17 should verify:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Manual QA should include:

* Confirm Settings data health or package metadata matches the current browser data.
* Confirm Export Backup is disabled when there is no exportable household data.
* Confirm Save to Google Drive is disabled and Settings explains missing configuration when `VITE_GOOGLE_CLIENT_ID` is not set.
* Confirm Save to Google Drive uploads a backup file when a Google OAuth client ID is configured.
* Export a backup and confirm package details match the app preview.
* Restore a valid backup after Clear Test Data.
* Reject invalid JSON.
* Reject non-HFOS JSON.
* Confirm failed restore attempts do not alter current browser data.
* Confirm Settings controls remain usable on mobile widths.

---

## Sprint Result

Sprint 17 is open. The first target is a cloud-ready local data package and clearer data-health visibility before any live cloud provider is introduced.
