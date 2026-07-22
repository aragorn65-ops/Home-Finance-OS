# Home Finance OS Sprint 41

## Supabase Auth Cloud Spike

**Release:** v0.41.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-41-supabase-auth-cloud-spike
**Status:** In progress

---

## Sprint Objective

Sprint 41 turns the Sprint 40 Supabase decision prep into a bounded
implementation spike.

The spike must prove schema, RLS, and adapter feasibility without migrating
real beta household data or replacing local-first storage.

---

## Planned Scope

* [x] Add a Supabase spike SQL draft that can be reviewed before running in a
      Supabase project.
* [x] Add environment variable documentation for a disabled-by-default
      Supabase provider.
* [x] Add a Supabase adapter skeleton behind `VITE_HFOS_AUTH_PROVIDER=supabase`
      without adding live data migration.
* [ ] Add spike validation notes for what must be tested in a disposable
      Supabase project.

---

## Out Of Scope

* Migrating real beta household data.
* Making Supabase the default provider.
* Enabling production login on the deployed beta.
* Implementing full remote CRUD or multi-device sync.
* Enabling Google Drive backup.

---

## Verification Targets

```text
npm.cmd test
npm.cmd run build
git diff --check
```
