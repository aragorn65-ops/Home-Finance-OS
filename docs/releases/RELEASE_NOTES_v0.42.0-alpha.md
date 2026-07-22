# Home Finance OS v0.42.0-alpha

## Supabase Client Wiring Readiness

**Release Date:** July 22, 2026
**Status:** Complete
**Sprint:** Sprint 42

---

## Overview

Home Finance OS v0.42.0-alpha prepares the Supabase spike for
disposable-project runtime testing while keeping the deployed beta local-first.

---

## Added

* Added auth diagnostics visibility for Supabase adapter selection and missing
  environment configuration.
* Added the Supabase JavaScript client dependency for the disposable-project
  spike.
* Wired read-only Supabase session and current-user lookup behind the
  `supabase` provider flag.
* Lazy-loaded the Supabase client so default local-first beta builds do not
  pull it into the initial app bundle.

---

## Deferred

* Production login.
* Production cloud sync.
* Real household data migration.
* Supabase as the default provider.

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed Supabase remains disabled unless explicit spike environment
  variables are configured.
