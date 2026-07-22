# Home Finance OS Sprint 39

## Post-Deploy Beta Hardening

**Release:** v0.39.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-39-post-deploy-beta-hardening
**Status:** In progress

---

## Sprint Objective

Sprint 39 hardens the deployed Cloudflare Pages beta after the first successful
live smoke check.

The sprint keeps HFOS local-first. The goal is to make beta testers more
confident about where their data lives, when to export backups, and how to
recover test data while the app remains browser-storage based.

---

## Planned Scope

* [x] Add an app-wide local-first beta notice.
* [x] Verify backup export and restore on the Cloudflare Pages deployment.
* [x] Add deployed beta smoke-test notes with the live URL.
* [x] Improve Settings backup/restore guidance if the deployed workflow reveals
      confusing copy.
* [x] Prepare the merge path back to `main` after Sprint 38 deployment branch
      validation.

---

## Out Of Scope

* Production cloud sync.
* Production auth provider onboarding.
* Server-side storage.
* Shared household invites and collaboration.
* New finance modules.

---

## Verification Targets

```text
npm.cmd test
npm.cmd run build
git diff --check
```

---

## Validation Notes

**Cloudflare Pages URL:** https://home-finance-os.pages.dev

Backup import and restore passed on the deployed site. Dashboard,
Transactions, Settlements, and Analytics loaded successfully after restore.

No Settings backup/restore copy changes were needed during this pass.

---

## Merge-Back Plan

After Sprint 39 validation, merge the deployment branches back to `main` in
order:

```text
sprint-38-cloudflare-pages-beta-deploy
sprint-39-post-deploy-beta-hardening
```

Then update the Cloudflare Pages production branch from the Sprint 38 branch
back to:

```text
main
```

Run the Cloudflare Pages smoke check again after the `main` deployment
succeeds.
