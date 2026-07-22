# Home Finance OS v0.38.0-alpha

## Cloudflare Pages Beta Deployment

**Release Date:** July 21, 2026
**Status:** Complete
**Sprint:** Sprint 38

---

## Overview

Home Finance OS v0.38.0-alpha prepares the guided private beta for Cloudflare
Pages hosting.

This release keeps the app local-first. Cloudflare Pages hosts the static Vite
frontend while HFOS data remains in the tester's browser localStorage.

---

## Highlights

* Deployed the guided local-first beta to Cloudflare Pages at
  https://home-finance-os.pages.dev.
* Added Cloudflare Pages deployment documentation.
* Added a Cloudflare Pages SPA fallback so direct client-side routes can refresh
  correctly.
* Added household member monthly expense contribution reporting to the
  Dashboard and Analytics surfaces.
* Kept household-wide income, cash-flow, and net-cash-flow reporting out of the
  shared Analytics page so those views remain aligned with private
  member-specific reporting.
* Defined deployed beta smoke checks for setup, finance workflows, settlements,
  backup, restore, and Clear Test Data.

---

## Deferred

* Production login provider.
* Production cloud sync.
* Server-side storage.
* Shared household invites and collaboration.
* New finance modules.

---

## Closure Validation

* Deployed Cloudflare Pages site passed smoke checks.
* Verified member expense contribution summary appears on the deployed site.
* Verified direct client-side route refreshes do not 404.
* `npm.cmd test` passed.
* `npm.cmd run build` passed.
* `git diff --check` passed.
