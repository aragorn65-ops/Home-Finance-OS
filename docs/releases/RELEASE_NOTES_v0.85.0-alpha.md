# Home Finance OS v0.85.0-alpha

## Public Beta Launch Checklist

**Release Date:** July 23, 2026
**Status:** Complete
**Sprint:** Sprint 85

---

## Overview

Home Finance OS v0.85.0-alpha adds a safety gate for public beta launch.

The new checklist makes public beta depend on explicit Cloudflare production
validation, route smoke checks, visible local-first safety notices,
backup/restore validation, reset behavior checks, and optional Google Drive
checks when configured.

---

## Added

* Added `docs/qa/Public-Beta-Launch-Checklist.md`.
* Updated the tester guide to use the Cloudflare Pages URL.
* Updated beta readiness language from private-beta candidate to
  safety-gated public beta review.

---

## Deferred

* Launching public beta.
* Application feature changes.
* Remote CRUD and sync.
* Production migration.
* Production Supabase credentials.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with sixty-one passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed the public beta checklist keeps public launch gated on production
  Cloudflare validation.
