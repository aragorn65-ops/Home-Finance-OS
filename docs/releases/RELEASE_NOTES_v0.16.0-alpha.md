# Home Finance OS v0.16.0-alpha

## Data Backup and Restore

**Release Date:** TBD
**Status:** In Progress
**Sprint:** Sprint 16

---

## Overview

Home Finance OS v0.16.0-alpha focuses on private-alpha data safety.

This release will add local backup export and restore workflows before moving toward Google Drive, cloud sync, or authenticated persistence.

---

## Highlights

* Added a Settings Data & Backup section.
* Added Export Backup for browser-local HFOS data as a versioned `.hfos-backup.json` file.
* Added Import Backup with validation before restore.
* Added Restore from Backup on the household setup screen for clean-browser recovery.
* Added restore confirmation before replacing current local data.
* Added restore preview metadata showing household name, export date, and record counts.
* Embedded the same summary metadata in exported backup files.
* Added rollback protection for restore write failures.
* Improved import retry behavior by clearing the selected file after failed validation.
* Styled valid restore-ready prompts with success coloring and kept failures red.
* Added non-destructive household name editing in Settings.
* Keep Clear Test Data for QA cleanup without deleting the household.
* Keep Reset All Application Data for full delete-and-return-to-setup.

---

## Backup Rules

* Backup files should identify themselves as HFOS backups.
* Backup files should include an app backup version and export timestamp.
* Backup files should include the current storage schema version.
* Backup files should include household, account, transaction, allocation, settlement, settlement application, savings goal, and savings activity records.
* Backup files include local theme preference.
* Backup files include summary metadata for restore preview and external inspection.
* Temporary browser session state should not be included.

---

## Restore Rules

* Invalid JSON should be rejected.
* Non-HFOS JSON files should be rejected.
* Unsupported backup versions should be rejected.
* Malformed required records should be rejected before current data is changed.
* Restore write failures should roll back to the pre-restore local data.
* Successful restore should reload the app.
* Restore replaces current browser-local HFOS data; it does not merge with current data.

---

## Deferred

* Google Drive backup.
* Auto-backup.
* Cross-device sync.
* Authentication.
* Server-side authorization.
* Encrypted backups.

---

## Manual QA Focus

Before finalizing this alpha, manually verify:

* Export creates a backup file with the expected `.hfos-backup.json` shape.
* Restore works after clearing browser data.
* Restore works from the household setup screen before creating a new household.
* Restore works after Clear Test Data.
* Restore preview metadata matches the selected backup before confirmation.
* Restore failure does not leave partial restored data.
* Invalid JSON restore shows a clear error.
* Non-HFOS JSON restore shows a clear error.
* Re-selecting the same rejected backup file runs validation again.
* Valid restore-ready prompts use success styling; failed restore/read/validation messages remain red.
* Restored transaction currency/rate fields remain unchanged.
* Household name changes in Settings do not alter accounts, transactions, reports, or backup restore.
* Settings Data & Backup controls remain usable on mobile widths.
