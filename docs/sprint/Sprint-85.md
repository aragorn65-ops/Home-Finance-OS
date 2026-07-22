# Home Finance OS Sprint 85

## Public Beta Launch Checklist

**Release:** v0.85.0-alpha
**Date:** 2026-07-23
**Branch:** sprint-85-public-beta-launch-checklist
**Status:** Complete

---

## Sprint Objective

Sprint 85 adds a safety gate for public beta launch.

The new public beta launch checklist requires a green Cloudflare Pages
production deployment, full route refresh checks, visible safety notices,
backup export/import restore validation, Clear Test Data and Reset All
Application Data checks, and optional Google Drive validation when Drive is
configured.

The sprint does not launch public beta by itself. It defines the checklist that
must pass before wider testers are invited.

---

## Planned Scope

* [x] Add a public beta launch checklist.
* [x] Keep launch gated on the current Cloudflare Pages production deployment.
* [x] Include local-first safety, backup, restore, and reset requirements.
* [x] Update the tester guide to use the Cloudflare Pages URL.

---

## Out Of Scope

* Launching public beta.
* Application feature changes.
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
* Verified the public beta checklist keeps public launch gated on production
  Cloudflare validation.
