# Home Finance OS Sprint 42

## Supabase Client Wiring Readiness

**Release:** v0.42.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-42-supabase-client-wiring
**Status:** In progress

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
* [ ] Add dependency-gated Supabase client creation for disposable-project
      testing.
* [ ] Wire read-only Supabase session lookup behind
      `VITE_HFOS_AUTH_PROVIDER=supabase`.
* [ ] Add tests proving missing env fails closed and configured env stays
      signed out until live auth is intentionally wired.

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
