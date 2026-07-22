# Home Finance OS Sprint 42

## Supabase Client Wiring Readiness

**Release:** v0.42.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-42-supabase-client-wiring
**Status:** Complete

---

## Sprint Objective

Sprint 42 prepares the Supabase spike for disposable-project runtime testing
without enabling production auth, production cloud sync, or real household data
migration.

The deployed Cloudflare Pages beta must remain local-first unless explicit
Supabase spike environment variables are set.

---

## Planned Scope

* [x] Show Supabase adapter selection and missing-env state in auth diagnostics.
* [x] Add dependency-gated Supabase client creation for disposable-project
      testing.
* [x] Wire read-only Supabase session lookup behind
      `VITE_HFOS_AUTH_PROVIDER=supabase`.
* [x] Add tests proving missing env fails closed and configured env can map a
      Supabase session without enabling migration writes.

---

## Out Of Scope

* Production login.
* Production remote CRUD.
* Service-role browser access.
* Real household migration.
* Making Supabase the default provider.

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
* Verified `npm.cmd test` completes with nine passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified the Supabase client is lazy-loaded into a separate build chunk.
* Confirmed household migration writes remain blocked for the Supabase provider
  during disposable-project readiness.
