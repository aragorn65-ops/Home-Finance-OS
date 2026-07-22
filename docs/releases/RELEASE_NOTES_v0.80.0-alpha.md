# Home Finance OS v0.80.0-alpha

## Cloudflare Pages Node Runtime Pin

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 80

---

## Overview

Home Finance OS v0.80.0-alpha improves deployment repeatability for Cloudflare
Pages.

The frontend package now declares Node `>=22.13.0`, and the Cloudflare Pages
deployment guide now pins the same runtime through `NODE_VERSION=22.13.0`.

---

## Added

* Added a frontend Node engine requirement.
* Updated package lock root metadata to match the package engine.
* Updated Cloudflare Pages deployment documentation with the exact runtime.

---

## Deferred

* Application feature changes.
* Importing full household records from cloud storage.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with sixty-one passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed the Cloudflare Pages runtime guidance matches the frontend package
  engine requirement.
