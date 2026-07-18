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

---

## Deferred

* Google Drive backup.
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
* Export a backup and confirm package details match the app preview.
* Restore a valid backup after Clear Test Data.
* Reject invalid JSON.
* Reject non-HFOS JSON.
* Confirm failed restore attempts do not alter current browser data.
* Confirm Settings controls remain usable on mobile widths.

---

## Sprint Result

Sprint 17 is open. The first target is a cloud-ready local data package and clearer data-health visibility before any live cloud provider is introduced.
