# Home Finance OS Sprint 84

## Public Beta Safety Notice

**Release:** v0.84.0-alpha
**Date:** 2026-07-23
**Branch:** sprint-84-public-beta-safety-notice
**Status:** Complete

---

## Sprint Objective

Sprint 84 strengthens in-app public beta safety language before wider testing.

The app shell beta banner now tells testers to use low-risk data, reminds them
that there is no account recovery or production sync, and asks them to export a
backup before and after meaningful testing. The Settings Data & Backup safety
note carries the same message at the point where backup and restore actions are
managed.

The sprint does not change application behavior, Google Drive permissions,
production auth, cloud sync, or household migration.

---

## Planned Scope

* [x] Strengthen the app-shell local-first beta notice.
* [x] Strengthen the Settings backup safety note.
* [x] Keep language concise enough for mobile layouts.
* [x] Keep the change focused on safety copy.

---

## Out Of Scope

* Application feature changes.
* Google OAuth client creation inside Google Cloud.
* Remote CRUD or sync.
* Production migration.
* Production Supabase credentials.

---

## Verification Targets

```text
git diff --check
npm.cmd test
npm.cmd run build
```

---

## Verification Results

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with sixty-one passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified the app shell and Settings backup area carry public beta safety
  language.
