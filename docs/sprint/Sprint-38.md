# Home Finance OS Sprint 38

## Cloudflare Pages Beta Deployment

**Release:** v0.38.0-alpha
**Date:** 2026-07-21
**Branch:** sprint-38-cloudflare-pages-beta-deploy
**Status:** In progress

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
* [ ] Deploy the GitHub-connected Pages project.
* [ ] Run deployed smoke checks for setup, accounts, transactions,
      settlements, backup, restore, and Clear Test Data.
* [ ] Record the deployed beta URL after the production deployment is ready.

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
