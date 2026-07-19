# Home Finance OS v0.20.0-alpha

## Security & Access Readiness

**Release Date:** July 19, 2026
**Status:** QA complete
**Sprint:** Sprint 20

---

## Overview

Home Finance OS v0.20.0-alpha focuses on practical privacy controls for a local-first household finance app.

The goal is to protect data when the browser or device is shared, while keeping HFOS usable without a backend account system. This release prepares the app for stronger future authentication without pretending local browser privacy is full cloud identity.

---

## Where We Are Now

Implementation and QA are complete for the Sprint 20 security and access readiness scope.

Manual QA passed across local app lock, inactivity lock, normal backup restore, password-protected backup restore, and Google Drive backup/restore compatibility.

---

## Planned Highlights

* Optional local app lock / PIN.
* Manual lock action.
* Lock on refresh or inactivity when enabled.
* Clear privacy controls in Settings.
* Backup protection exploration.
* Google Drive backup/restore compatibility.
* Future auth architecture notes.

---

## Added

* Dashboard quick action for unpaid provider bills.
* Empty Bills to Pay message when every provider bill has been paid.
* Local app lock setup.
* Unlock screen before household data is shown.
* Optional inactivity lock timing for app lock.
* Privacy/session settings.
* Documentation for local lock limitations.
* Optional password-protected local backup export.
* Password prompt and validation for protected backup import.
* Google Drive backup/restore compatibility for normal and protected HFOS backup files.
* Future full-auth path documented separately from local app lock.

---

## Deferred

* Full user accounts.
* Backend login.
* Household sharing by account.
* Multi-device sync.
* Role-based access permissions.
