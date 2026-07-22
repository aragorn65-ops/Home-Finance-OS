# Home Finance OS v0.44.0-alpha

## Supabase Auth Callback Handling

**Release Date:** July 22, 2026
**Status:** In progress
**Sprint:** Sprint 44

---

## Overview

Home Finance OS v0.44.0-alpha makes the disposable Supabase magic-link spike
refresh local auth session state after callback/session changes.

Production login and remote household migration remain disabled.

---

## Added

* Added optional auth session subscription support for backend adapters.
* Wired Supabase `onAuthStateChange` into the HFOS auth session hook.
* Added browser hash-change and focus refresh signals for magic-link callback
  testing.
* Added tests for Supabase auth-state notification and unsubscribe behavior.

---

## Deferred

* Production login.
* Supabase signup.
* Household claims against Supabase.
* Remote CRUD and sync.
* Real household migration.
