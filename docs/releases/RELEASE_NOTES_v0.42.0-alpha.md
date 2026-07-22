# Home Finance OS v0.42.0-alpha

## Supabase Client Wiring Readiness

**Release Date:** July 22, 2026
**Status:** In progress
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
