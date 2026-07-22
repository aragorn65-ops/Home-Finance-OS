# Home Finance OS Sprint 43

## Supabase Magic Link Spike

**Release:** v0.43.0-alpha
**Date:** 2026-07-22
**Branch:** sprint-43-supabase-magic-link-spike
**Status:** Complete

---

## Sprint Objective

Sprint 43 adds a disposable-project Supabase magic-link request path behind the
existing Supabase provider flag.

The sprint must not enable production login, household migration writes, or
remote CRUD.

---

## Planned Scope

* [x] Extend the auth adapter sign-in contract with optional email/redirect
      input.
* [x] Wire Supabase `signInWithOtp` for disposable-project magic-link requests.
* [x] Add a Supabase-only diagnostics form for requesting a magic link.
* [x] Add tests proving magic-link requests trim email, preserve redirect, and
      do not auto-create users.

---

## Out Of Scope

* Production login enablement.
* New-user signup.
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
* Verified `npm.cmd test` completes with ten passing tests.
* Verified `npm.cmd run build` completes with zero errors.
* Verified the Supabase client remains lazy-loaded in a separate build chunk.
* Confirmed Supabase magic-link requests use `shouldCreateUser: false`.
