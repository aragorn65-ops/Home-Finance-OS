# Sprint 88

## Cloud Schema Readiness Diagnostics

**Branch:** main

---

## Intent

Sprint 88 makes the Sprint 87 cloud schema target visible inside production
Auth Diagnostics before HFOS adds upload, remote CRUD, or automatic sync paths.

The goal is to prove the configured Supabase project has the expected remote
tables while preserving the local-first runtime boundary.

---

## Planned Scope

* [x] Add Supabase schema readiness probes for the Sprint 87 cloud data tables.
* [x] Surface a Cloud Schema Readiness section in Auth Diagnostics.
* [x] Mark missing or inaccessible tables as blocked without breaking the rest
      of the diagnostics panel.
* [x] Keep probes read-only and scoped to harmless empty-id lookups.
* [x] Add focused adapter coverage for passing and blocked schema checks.

---

## Out Of Scope

* Remote CRUD.
* Uploading local household records.
* Automatic multi-device sync.
* Realtime subscriptions.
* Conflict resolution.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual production Auth Diagnostics refresh after the updated schema has been
  run in Supabase.

---

## Notes For Sprint 89

Sprint 89 can add a migration upload contract for dry-run/count validation, but
it should still avoid remote record writes until schema readiness is passing in
production.
