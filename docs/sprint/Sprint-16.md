# Home Finance OS Sprint 16

## Data Backup and Restore

**Release:** v0.16.0-alpha
**Date:** July 18, 2026
**Branch:** sprint-16-data-backup-restore
**Status:** Open

---

## Sprint Objective

Sprint 16 should make private-alpha data safer before cloud sync or authentication work begins.

The main goal is to let a user export the browser-local HFOS data into a portable backup file and restore from a validated backup file later. This should protect test households during QA and create the foundation for future Google Drive or cloud backup integrations.

---

## Planned Scope

Sprint 16 candidates include:

* Add a Settings Data & Backup section.
* Add Export Backup for current browser-local HFOS data.
* Add Import / Restore Backup from a local `.hfos-backup.json` file.
* Validate backup schema, app name, backup version, and required data collections before restore.
* Warn clearly before restore replaces current browser data.
* Reload after successful restore so repository state hydrates from restored storage.
* Keep Clear Test Data and Reset All Application Data distinct from backup/restore.
* Update HOW_TO_USE and release notes with backup/restore guidance.

---

## Backup File Scope

Recommended first slice:

* Store a versioned backup envelope.
* Include created/exported timestamp.
* Include HFOS storage schema version.
* Include the active household record.
* Include accounts, transactions, expense allocations, settlements, settlement applications, savings goals, and savings activities.
* Include display preferences only when they are useful and non-sensitive, such as theme preference.
* Do not include browser-only temporary session state such as the selected reporting month.

Implemented:

* Added a local backup service that exports a versioned HFOS `.hfos-backup.json` file.
* Included household, accounts, transactions, expense allocations, settlements, settlement applications, savings goals, savings activities, and theme preference in the backup file.
* Added Settings Data & Backup controls for Export Backup and Import Backup.
* Added Restore from Backup on the household setup screen so a clean browser can restore without creating a temporary household.
* Added restore validation for JSON parsing, HFOS backup identity, backup version, storage schema version, required records, collection shape, household shape, and theme preference shape.
* Added a restore confirmation before replacing current browser-local HFOS data.
* Added restore preview metadata showing household name, export date, and record counts before confirmation.
* Reloaded the app after successful restore so repositories hydrate from restored storage.

Deferred:

* Google Drive backup.
* Auto-backup scheduling.
* Conflict resolution between multiple devices.
* Authenticated cloud storage.
* Encrypted backup files.

---

## Restore Rules

Restore should:

* Require an explicit file selection.
* Reject invalid JSON.
* Reject files that are not HFOS backup files.
* Reject unsupported backup versions.
* Reject malformed required collections.
* Show a confirmation before replacing current local data.
* Replace current browser-local HFOS records only after validation passes.
* Reload after success.

Restore should not:

* Merge partially with current data in the first slice.
* Silently overwrite current data.
* Recompute historical currency conversions.
* Seed demo data after restore.

---

## Settings UX

Settings should separate data actions by intent:

* Data & Backup
  * Export Backup
  * Import Backup
* QA Cleanup
  * Clear Test Data
* Full Reset
  * Reset All Application Data

Backup and restore should feel practical and calm, not like a dashboard prompt. Future Google Drive backup can live in the same Data & Backup section after local backup/restore is stable.

---

## Verification Targets

Sprint 16 should verify:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Manual QA should include:

* Export from a household with accounts and transactions.
* Restore into a clean browser state.
* Restore from the household setup screen before creating a new household.
* Restore after Clear Test Data.
* Confirm restore preview metadata matches the selected backup before restoring.
* Reject invalid JSON.
* Reject a JSON file that is not an HFOS backup.
* Confirm restored historical currency fields remain unchanged.
* Confirm Settings backup/restore controls fit mobile and tablet widths.

---

## Sprint Result

Sprint 16 is open. The first local export/import backup slice is implemented and ready for manual QA.
