# Home Finance OS v0.43.0-alpha

## Supabase Magic Link Spike

**Release Date:** July 22, 2026
**Status:** In progress
**Sprint:** Sprint 43

---

## Overview

Home Finance OS v0.43.0-alpha adds a disposable-project Supabase magic-link
request path while keeping production auth and remote migration disabled.

---

## Added

* Added optional email and redirect input to the auth sign-in contract.
* Added Supabase magic-link request support behind the `supabase` provider flag.
* Added a Supabase-only diagnostics form for disposable-project magic-link
  testing.
* Added tests for trimmed email, redirect preservation, and disabled automatic
  user creation.

---

## Deferred

* Production login.
* Production signup.
* Household claims against Supabase.
* Remote CRUD and sync.
* Real household migration.
