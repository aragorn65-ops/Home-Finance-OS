# Home Finance OS Sprint 20

## Security & Access Readiness

**Release:** v0.20.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-20-security-access-readiness
**Status:** QA complete

---

## Sprint Objective

Sprint 20 adds practical privacy controls for HFOS before moving toward full login/auth.

HFOS is still a local-first app, so the priority is to protect household data on the current device and make backup files safer. Full account login, backend identity, and multi-device household sharing remain future architecture work.

---

## Where We Are Now

As of July 19, 2026, Sprint 20 implementation is complete on `sprint-20-security-access-readiness`.

HFOS now has local app lock, manual lock, refresh lock, inactivity lock, Settings privacy controls, normal backup export/import, optional password-protected backup export/import, and Google Drive backup/restore compatibility for both normal and protected HFOS backup files.

Manual QA has passed for app-lock timing, protected backup restore, and Google Drive restore visibility.

Verified locally:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

---

## Planned Scope

Sprint 20 candidates include:

* [x] Add a dashboard quick action for unpaid provider bills.
* [x] Show an empty Bills to Pay state when no unpaid provider bills exist.
* [x] Add an optional local app lock / PIN.
* [x] Support manual lock from the app shell.
* [x] Lock the app after browser refresh when app lock is enabled.
* [x] Add clear privacy/session controls in Settings.
* [x] Lock the app after inactivity when app lock is enabled.
* [x] Explore password-protected backup export/import.
* [x] Keep Google Drive backup/restore compatible with current backups.
* [x] Document the future full-auth path separately from local app lock.

---

## Security Rules

Sprint 20 should:

* Treat app lock as local browser privacy, not real account authentication.
* Avoid storing plain PIN values.
* Keep existing backups restorable unless password protection is explicitly enabled.
* Keep Google Drive access optional.
* Clearly explain what is protected locally and what is not.
* Treat backup password protection as file encryption only, not account recovery or cloud identity.

Sprint 20 should not:

* Add a backend before the auth model is designed.
* Pretend local PIN lock is equivalent to cloud login.
* Break existing local or Google Drive backups.
* Require Google login to use HFOS.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

## QA Pass - July 19, 2026

Automated and local smoke QA completed:

* [x] `npm.cmd run build`
* [x] `npm.cmd run lint`
* [x] `git diff --check`
* [x] Local Vite server returned HTTP 200 at `http://127.0.0.1:5173/`.
* [x] Dashboard quick action links Unpaid Bills to `/app/utilities#bills-to-pay`.
* [x] Bills to Pay renders a clear empty state when there are no unpaid provider bills.
* [x] App shell initializes locked after refresh when app lock is enabled.
* [x] Header shows Lock HFOS only when app lock is enabled.
* [x] Inactivity timer listens for normal activity events and locks after the configured timeout.
* [x] Clear Test Data preserves the app lock storage key.
* [x] Normal backups keep the existing `.hfos-backup.json` format.
* [x] Password-protected backups use an explicit protected envelope and require a password before preview or restore.
* [x] Google Drive backup listing still matches normal and protected HFOS backup filenames.

Manual browser QA completed:

* [x] Click Dashboard > Quick Actions > Unpaid Bills and confirm the Utilities page scrolls to Bills to Pay.
* [x] Enable app lock and set a PIN through Settings.
* [x] Confirm manual Lock HFOS opens the unlock screen.
* [x] Confirm refresh lock opens the unlock screen.
* [x] Confirm incorrect PIN is rejected and correct PIN unlocks.
* [x] Confirm 1-minute inactivity lock fires and normal activity resets the timer.
* [x] Export, import, preview, and restore a normal backup through the UI.
* [x] Export, import, unlock, preview, and restore a password-protected backup through the UI.
* [x] Save normal and password-protected backups to Google Drive, then confirm both appear in Restore from Google Drive.

Manual QA should include:

* Confirm Dashboard > Quick Actions includes Unpaid Bills.
* Confirm Unpaid Bills opens Utilities at Bills to Pay.
* Confirm Bills to Pay shows an empty state when there are no unpaid provider bills.
* Enable app lock and set a PIN.
* Confirm the header shows a Lock HFOS action after app lock is enabled.
* Set inactivity lock to 1 minute and confirm HFOS locks after no activity.
* Confirm normal clicks/typing reset the inactivity timer.
* Refresh the browser and confirm the app locks.
* Unlock with the correct PIN.
* Reject an incorrect PIN.
* Disable app lock from Settings.
* Confirm Clear Test Data keeps app lock enabled.
* Confirm backup/restore still works with app lock settings present.
* Export a normal backup and confirm it previews/restores without a password.
* Export a password-protected backup and confirm it requires the backup password before preview/restore.
* Save a normal backup to Google Drive and confirm it remains visible in the Drive restore list.
* Save a password-protected backup to Google Drive and confirm it remains visible in the Drive restore list.
