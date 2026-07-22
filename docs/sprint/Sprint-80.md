# Home Finance OS Sprint 80

## Cloudflare Pages Node Runtime Pin

**Release:** v0.80.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-80-cloudflare-node-runtime-pin
**Status:** Complete

---

## Sprint Objective

Sprint 80 makes the frontend build runtime expectation explicit for Cloudflare
Pages and local dependency installation.

The frontend package now declares Node `>=22.13.0`, and the Cloudflare Pages
deployment guide now pins `NODE_VERSION=22.13.0` so the hosted build matches
the Vite, Rolldown, and Supabase dependency requirements.

The sprint does not change application behavior, production auth, cloud sync,
or household migration.

---

## Planned Scope

* [x] Add a frontend Node engine requirement.
* [x] Keep the package lock root metadata aligned.
* [x] Update Cloudflare Pages deployment documentation.
* [x] Keep the change deployment-focused and local-first.

---

## Out Of Scope

* Application feature changes.
* Importing full household records from cloud storage.
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
* Verified the documented Cloudflare Pages runtime matches the frontend package
  engine requirement.
