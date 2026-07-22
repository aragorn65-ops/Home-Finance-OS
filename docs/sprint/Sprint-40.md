# Home Finance OS Sprint 40

## Auth And Cloud Decision Prep

**Release:** v0.40.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-40-auth-cloud-decision
**Status:** In progress

---

## Sprint Objective

Sprint 40 prepares the next architecture decision after the deployed
local-first beta.

The sprint does not implement production auth or cloud sync. It documents the
decision path for login, remote storage, Google Drive backup configuration, and
multi-device household collaboration so HFOS can move deliberately instead of
mixing prototype auth with production data migration.

---

## Planned Scope

* [x] Record that Google Drive backup is disabled unless
      `VITE_GOOGLE_CLIENT_ID` is configured.
* [ ] Review existing auth and cloud-sync architecture notes.
* [ ] Define the production auth/provider decision criteria.
* [ ] Define the remote storage and migration decision criteria.
* [ ] Identify the next smallest implementation slice after the decision.

---

## Out Of Scope

* Enabling production Google Drive backup.
* Adding production login.
* Adding server-side storage.
* Adding shared household invites or collaboration.
* Migrating browser-local household data automatically.

---

## Verification Targets

```text
npm.cmd test
npm.cmd run build
git diff --check
```
