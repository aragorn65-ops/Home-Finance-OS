# Home Finance OS v0.39.0-alpha

## Post-Deploy Beta Hardening

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 39

---

## Overview

Home Finance OS v0.39.0-alpha follows the first Cloudflare Pages deployment
with focused beta hardening.

This release keeps the app local-first. Cloudflare Pages hosts the static
frontend, and household data remains in the tester's browser localStorage.

---

## Highlights

* Added a visible local-first beta notice to the deployed app shell.
* Added a Settings backup safety note for browser-local data recovery limits.
* Reconfirmed backup export and restore on the deployed Cloudflare Pages site.
* Documented the deployed smoke-test path using the live beta URL.
* Kept production login, sync, and shared household collaboration out of scope.

---

## Deferred

* Production login provider.
* Production cloud sync.
* Server-side storage.
* Shared household invites and collaboration.
* New finance modules.

---

## Validation

* Backup import and restore passed on https://home-finance-os.pages.dev.
* Dashboard, Transactions, Settlements, and Analytics loaded successfully after
  restore.
* `npm.cmd test` passed.
* `npm.cmd run build` passed.
* `git diff --check` passed.
