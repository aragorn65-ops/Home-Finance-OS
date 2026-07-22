# Home Finance OS v0.41.0-alpha

## Supabase Auth Cloud Spike

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 41

---

## Overview

Home Finance OS v0.41.0-alpha starts a bounded Supabase Auth + Postgres/RLS
spike.

The release keeps the deployed beta local-first. Supabase work must stay behind
configuration flags and must not migrate real household data.

---

## Planned Highlights

* Add a reviewable Supabase SQL spike draft.
* Document Supabase environment variables.
* Add a disabled-by-default Supabase adapter skeleton.
* Document disposable-project validation steps.

## Added

* Added a disposable Supabase SQL spike draft for schema and RLS review.
* Documented disabled-by-default Supabase Vite environment variables.
* Added a dependency-free Supabase auth adapter skeleton behind the
  `supabase` provider flag.
* Added disposable-project Supabase spike validation notes.

---

## Deferred

* Production login.
* Production cloud sync.
* Real household data migration.
* Multi-device collaboration.
* Google Drive backup enablement.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed Supabase remains disabled by default for the Cloudflare Pages beta.
