# Home Finance OS Sprint 38

## Cloudflare Pages Beta Deployment

**Release:** v0.38.0-alpha
**Date:** 2026-07-21
**Branch:** sprint-38-cloudflare-pages-beta-deploy
**Status:** Deployed; smoke checks passed

---

## Sprint Objective

Sprint 38 moves HFOS from local-only preview readiness toward a repeatable
Cloudflare Pages beta deployment.

The sprint keeps HFOS local-first. Cloudflare Pages hosts the static app shell;
browser localStorage remains the active beta data store.

---

## Planned Scope

* [x] Add Cloudflare Pages deployment documentation.
* [x] Add a Cloudflare Pages SPA fallback for client-side routes.
* [x] Deploy the GitHub-connected Pages project.
* [x] Run deployed smoke checks for setup, accounts, transactions,
      settlements, backup, restore, and Clear Test Data.
* [x] Record the deployed beta URL after the production deployment is ready.

---

## Deployment

**Cloudflare Pages URL:** https://home-finance-os.pages.dev

**Pages settings used:**

```text
Project name: home-finance-os
Production branch: sprint-38-cloudflare-pages-beta-deploy
Framework preset: None
Root directory: frontend
Build command: npm run build
Build output directory: dist
NODE_VERSION: 22
```

**Smoke check:** Passed on the deployed Cloudflare Pages site.

---

## Out Of Scope

* Production cloud sync.
* Production auth provider onboarding.
* Shared household collaboration.
* Server-side data persistence.
* New finance modules.

---

## Verification Targets

```text
npm.cmd test
npm.cmd run build
git diff --check
```
