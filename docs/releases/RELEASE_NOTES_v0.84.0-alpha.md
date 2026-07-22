# Home Finance OS v0.84.0-alpha

## Public Beta Safety Notice

**Release Date:** July 23, 2026
**Status:** Complete
**Sprint:** Sprint 84

---

## Overview

Home Finance OS v0.84.0-alpha strengthens in-app safety language before wider
public beta testing.

The app now more clearly reminds testers to use low-risk data, export backups,
and remember that this build has no account recovery or production sync.

---

## Added

* Updated the app-shell beta banner with public beta safety language.
* Updated the Settings Data & Backup safety note with the same warning.
* Kept local backup export and import as the recovery path.

---

## Deferred

* Application feature changes.
* Google OAuth client creation inside Google Cloud.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with sixty-one passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed the app shell and Settings backup area carry public beta safety
  language.
