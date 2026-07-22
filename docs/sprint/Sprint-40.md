# Home Finance OS Sprint 40

## Auth And Cloud Decision Prep

**Release:** v0.40.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-40-auth-cloud-decision
**Status:** Completed

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
* [x] Review existing auth and cloud-sync architecture notes.
* [x] Define the production auth/provider decision criteria.
* [x] Define the remote storage and migration decision criteria.
* [x] Identify the next smallest implementation slice after the decision.
* [x] Compare provider/storage candidates for the first implementation spike.
* [x] Draft the Supabase schema, RLS, adapter, and proof plan for the spike.

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

---

## Closure Notes

Sprint 40 closed as a decision-prep sprint. No production auth, cloud sync,
Google Drive configuration, server-side storage, or automatic local-to-cloud
migration was implemented.

Supabase Auth + Postgres/RLS is the leading candidate for the next spike, with
decision criteria and stop conditions documented before implementation.

Final closure validation:

```text
npm.cmd test
npm.cmd run build
git diff --check
```
