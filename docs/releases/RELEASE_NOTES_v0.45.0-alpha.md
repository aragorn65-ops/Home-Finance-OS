# Home Finance OS v0.45.0-alpha

## Supabase Membership Read Spike

**Release Date:** July 22, 2026
**Status:** In progress
**Sprint:** Sprint 45

---

## Overview

Home Finance OS v0.45.0-alpha adds read-only Supabase household membership
lookup for disposable-project testing.

Production membership writes, household claims, remote CRUD, and real
migration remain disabled.

---

## Added

* Added Supabase `household_memberships` lookup scoped to the current user.
* Added Supabase-to-HFOS membership row mapping.
* Added fail-closed handling for unknown membership roles or statuses.
* Added tests for query shape, user filtering, row mapping, and invalid-row
  filtering.

---

## Deferred

* Membership writes.
* Household claims against Supabase.
* Invites.
* Remote CRUD and sync.
* Real household migration.
