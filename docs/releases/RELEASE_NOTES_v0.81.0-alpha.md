# Home Finance OS v0.81.0-alpha

## Cloudflare Route Smoke Checklist

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 81

---

## Overview

Home Finance OS v0.81.0-alpha improves Cloudflare Pages deployment validation
documentation.

The smoke checklist now asks testers to open and refresh every first-class app
route, not just the original core five routes.

---

## Added

* Expanded the Cloudflare Pages smoke-check route list.
* Added the full route refresh expectation to deployment documentation.
* Kept backup and restore validation on the local-first smoke-check path.

---

## Deferred

* Application feature changes.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.
* Automated browser smoke-test tooling.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with sixty-one passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed the smoke checklist covers `/`, `/app`, and each top-level app
  route.
