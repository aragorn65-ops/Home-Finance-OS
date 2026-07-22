# Home Finance OS v0.82.0-alpha

## Cloudflare Google Drive Backup Config

**Release Date:** July 23, 2026
**Status:** Complete
**Sprint:** Sprint 82

---

## Overview

Home Finance OS v0.82.0-alpha clarifies Google Drive backup enablement for the
Cloudflare Pages beta.

The docs now explain that Drive backup requires `VITE_GOOGLE_CLIENT_ID` in
Cloudflare Pages, the Google OAuth client must allow the live Pages origin, and
the site must be redeployed after the environment variable changes.

---

## Added

* Updated Google Drive backup guidance for Cloudflare Pages.
* Added the optional `VITE_GOOGLE_CLIENT_ID` Cloudflare Pages environment
  variable to deployment docs.
* Added smoke-check guidance for verifying Drive buttons become enabled after
  configuration.

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
* Confirmed Google Drive backup enablement docs point to
  `VITE_GOOGLE_CLIENT_ID` in Cloudflare Pages.
