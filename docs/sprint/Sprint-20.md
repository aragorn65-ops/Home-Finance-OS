# Home Finance OS Sprint 20

## Security & Access Readiness

**Release:** v0.20.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-20-security-access-readiness
**Status:** Open

---

## Sprint Objective

Sprint 20 adds practical privacy controls for HFOS before moving toward full login/auth.

HFOS is still a local-first app, so the priority is to protect household data on the current device and make backup files safer. Full account login, backend identity, and multi-device household sharing remain future architecture work.

---

## Planned Scope

Sprint 20 candidates include:

* [x] Add a dashboard quick action for unpaid provider bills.
* [x] Show an empty Bills to Pay state when no unpaid provider bills exist.
* [x] Add an optional local app lock / PIN.
* [x] Support manual lock from the app shell.
* [x] Lock the app after browser refresh when app lock is enabled.
* [x] Add clear privacy/session controls in Settings.
* [ ] Lock the app after inactivity when app lock is enabled.
* [ ] Explore password-protected backup export/import.
* [ ] Keep Google Drive backup/restore compatible with current backups.
* [ ] Document the future full-auth path separately from local app lock.

---

## Security Rules

Sprint 20 should:

* Treat app lock as local browser privacy, not real account authentication.
* Avoid storing plain PIN values.
* Keep existing backups restorable unless password protection is explicitly enabled.
* Keep Google Drive access optional.
* Clearly explain what is protected locally and what is not.

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

Manual QA should include:

* Confirm Dashboard > Quick Actions includes Unpaid Bills.
* Confirm Unpaid Bills opens Utilities at Bills to Pay.
* Confirm Bills to Pay shows an empty state when there are no unpaid provider bills.
* Enable app lock and set a PIN.
* Confirm the header shows a Lock HFOS action after app lock is enabled.
* Refresh the browser and confirm the app locks.
* Unlock with the correct PIN.
* Reject an incorrect PIN.
* Disable app lock from Settings.
* Confirm Clear Test Data keeps app lock enabled.
* Confirm backup/restore still works with app lock settings present.
