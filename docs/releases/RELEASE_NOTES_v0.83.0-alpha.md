# Home Finance OS v0.83.0-alpha

## Google Drive Settings Status Clarity

**Release Date:** July 23, 2026
**Status:** Complete
**Sprint:** Sprint 83

---

## Overview

Home Finance OS v0.83.0-alpha makes Google Drive backup configuration clearer
inside Settings.

The Data & Backup section now shows whether Google Drive backup is configured
for the current build, and tells testers what Cloudflare Pages variable is
missing when Drive actions are disabled.

---

## Added

* Added an always-visible Google Drive configuration status note in Settings.
* Named `VITE_GOOGLE_CLIENT_ID` and Cloudflare Pages when Drive backup is not
  configured.
* Explained that configured builds still require Google permission before Drive
  save or restore actions complete.

---

## Deferred

* Google OAuth client creation inside Google Cloud.
* Changing Google Drive scopes.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with sixty-one passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed Settings explains why Google Drive buttons are enabled or disabled.
