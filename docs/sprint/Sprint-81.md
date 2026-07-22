# Home Finance OS Sprint 81

## Cloudflare Route Smoke Checklist

**Release:** v0.81.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-81-cloudflare-route-smoke-check-docs
**Status:** Complete

---

## Sprint Objective

Sprint 81 expands Cloudflare Pages smoke-check documentation so every
first-class app route is opened and refreshed after preview or production
deployments.

The checklist now covers `/`, `/app`, and each sidebar route: household
members, accounts, transactions, utilities, settlements, savings, analytics,
help center, and settings.

The sprint does not change application behavior, production auth, cloud sync,
or household migration.

---

## Planned Scope

* [x] Expand the Cloudflare Pages smoke-check route list.
* [x] Add the same route refresh expectation to deployment docs.
* [x] Keep backup and restore smoke checks local-first.
* [x] Keep the change documentation-only.

---

## Out Of Scope

* Application feature changes.
* Remote CRUD or sync.
* Production migration.
* Production Supabase credentials.
* Automated browser smoke-test tooling.

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
* Verified the smoke checklist covers `/`, `/app`, and each top-level app
  route.
