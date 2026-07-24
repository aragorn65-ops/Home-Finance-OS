# Sprint 95

## Pre-Commit Remote Staging Audit

**Branch:** main

---

## Intent

Sprint 95 adds a read-only audit step after account and transaction staging.
The audit checks whether the remote staged household data is internally
consistent before any future commit unlock work.

Commit remains locked. This sprint is about visibility and safety, not turning
remote persistence into the live source of truth.

---

## Planned Scope

* [x] Add a Supabase `audit_migration_precommit` RPC for owned migration drafts.
* [x] Check staged lifecycle timestamps before reporting readiness.
* [x] Compare staged account and transaction counts with checkpoint counts.
* [x] Block readiness when staged expenses are missing source accounts.
* [x] Surface an explicit Audit commit action in the migration checkpoint UI.
* [x] Keep Commit locked.

---

## Out Of Scope

* Commit unlock.
* Remote CRUD.
* Automatic multi-device sync.
* Expense allocation upload staging.
* Making staged data the live source of truth.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual Supabase check: after rerunning the updated schema SQL and refreshing
  the app, **Audit commit** reports ready for a fully staged checkpoint.

---

## Notes For Next Step

The next sprint can begin staging expense allocations or add the final
commit-unlock checklist. Allocation staging should resolve transaction links by
local record id and keep member mapping conservative.
