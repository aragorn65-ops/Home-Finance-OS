# Home Finance OS Sprint 82

## Cloudflare Google Drive Backup Config

**Release:** v0.82.0-alpha
**Date:** 2026-07-23
**Branch:** sprint-82-cloudflare-google-drive-config-docs
**Status:** Complete

---

## Sprint Objective

Sprint 82 clarifies how Google Drive backup is enabled on the Cloudflare Pages
beta.

The beta guide, deployment guide, smoke checklist, and frontend environment
example now point to Cloudflare Pages environment variables, the
`VITE_GOOGLE_CLIENT_ID` build-time requirement, the live Pages origin, and the
need to redeploy after changing the client id.

The sprint does not change application behavior, production auth, cloud sync,
or household migration.

---

## Planned Scope

* [x] Update the beta guide from GitHub Pages wording to Cloudflare Pages.
* [x] Document `VITE_GOOGLE_CLIENT_ID` as a Cloudflare Pages environment
  variable.
* [x] Document the Google OAuth origin for the live Pages deployment.
* [x] Add smoke-check guidance for confirming Drive buttons are enabled.

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
* Verified Google Drive backup enablement docs point to
  `VITE_GOOGLE_CLIENT_ID` in Cloudflare Pages.
