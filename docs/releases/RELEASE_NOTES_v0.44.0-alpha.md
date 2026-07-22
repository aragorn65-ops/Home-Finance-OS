# Home Finance OS v0.44.0-alpha

## Supabase Auth Callback Handling

**Release Date:** July 22, 2026
**Status:** Complete
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

---

## Verified

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with eleven passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Confirmed Supabase auth callback handling remains behind explicit spike
  environment configuration.
