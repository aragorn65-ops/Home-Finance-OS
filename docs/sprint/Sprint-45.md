# Home Finance OS Sprint 45

## Supabase Membership Read Spike

**Release:** v0.45.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-45-supabase-membership-read
**Status:** In progress

---

## Sprint Objective

Sprint 45 adds read-only Supabase household membership lookup for signed-in
disposable-project users.

The sprint must preserve RLS-first behavior and must not add household claim,
membership write, remote CRUD, or real migration flows.

---

## Planned Scope

* [x] Query `household_memberships` for the current Supabase user.
* [x] Map Supabase membership rows into HFOS `HouseholdMembership` models.
* [x] Drop unknown membership roles or statuses instead of surfacing invalid
      records.
* [x] Add tests proving user-scoped membership lookup and row mapping.

---

## Out Of Scope

* Membership writes.
* Household claims against Supabase.
* Invites.
* Remote CRUD or sync.
* Real household migration.

---

## Verification Targets

```text
git diff --check
npm.cmd test
npm.cmd run build
```
