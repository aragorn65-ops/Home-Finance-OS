# Home Finance OS Sprint 44

## Supabase Auth Callback Handling

**Release:** v0.44.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-44-supabase-auth-callback
**Status:** Complete

---

## Sprint Objective

Sprint 44 makes the disposable Supabase magic-link spike able to notice auth
callback/session changes after a tester follows a magic link.

The sprint keeps production login, household claims, migration writes, and
remote CRUD disabled.

---

## Planned Scope

* [x] Add optional auth session subscription support to the backend adapter
      layer.
* [x] Wire Supabase `onAuthStateChange` to refresh HFOS session state.
* [x] Refresh the local auth session on browser hash changes and focus returns
      during magic-link callback testing.
* [x] Add tests proving Supabase auth-state subscriptions notify and
      unsubscribe cleanly.

---

## Out Of Scope

* Production login enablement.
* Supabase signup.
* Household claims against Supabase.
* Remote CRUD or sync.
* Real household migration.

---

## Verification Targets

```text
git diff --check
npm.cmd test
npm.cmd run build
```

---

## Verification Results

* Verified `git diff --check` completes with no whitespace errors.
* Verified `npm.cmd test` completes with eleven passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified the Supabase client remains lazy-loaded in a separate build chunk.
* Confirmed Supabase household migration writes remain blocked.
