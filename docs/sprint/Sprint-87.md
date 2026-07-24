# Sprint 87

## Cloud Data Schema Groundwork

**Branch:** main

---

## Intent

Sprint 87 adds the first production-auth cloud data schema target after the
Sprint 86 auth baseline passed in Cloudflare Pages production.

This sprint remains schema-only. HFOS still runs local-first in the browser,
and remote CRUD, automatic sync, and production data migration remain disabled.

---

## Planned Scope

* [x] Extend the Supabase schema with remote tables for the remaining HFOS
      local record domains.
* [x] Preserve browser-local ids through `local_record_id` columns instead of
      assuming local ids are valid UUIDs.
* [x] Add JSONB snapshot fields for local-only payloads that are not ready for
      normalized remote APIs.
* [x] Keep remote tables behind household-scoped RLS read policies.
* [x] Make schema policy setup safe to rerun in the Supabase SQL editor.

---

## Out Of Scope

* Remote CRUD from the app.
* Automatic multi-device sync.
* Uploading full local household records.
* Realtime subscriptions.
* Conflict resolution.
* Importing remote records back into local browser storage.

---

## Schema Additions

Sprint 87 extends `docs/architecture/supabase-spike-schema.sql` with:

* richer `accounts` columns for balances, institution, liability metadata,
  currency conversion, and local id mapping;
* richer `transactions` columns for entered/base currency, exchange rates,
  notes, attachments, split method, and local id mapping;
* `expense_allocations`;
* `utility_provider_bills`;
* `settlements`;
* `settlement_applications`;
* `savings_goals`;
* `savings_activities`.

Remote tables use UUID primary keys and preserve imported browser identifiers
with per-household `local_record_id` values. This keeps future migration
mapping explicit and avoids relying on browser-generated ids as backend primary
keys.

---

## Verification Targets

* `git diff --check`
* Run the updated schema in a disposable Supabase project.
* Refresh production Auth Diagnostics and confirm Sprint 86 checks still pass.

---

## Notes For Sprint 88

Sprint 88 should add a read-only schema readiness diagnostic so HFOS can report
which remote tables are present before any upload RPCs or remote CRUD are
introduced.
