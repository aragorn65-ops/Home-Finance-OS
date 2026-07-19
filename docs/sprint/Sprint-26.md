# Home Finance OS Sprint 26

## Auth Prototype Toggle

**Release:** v0.26.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-26-auth-prototype-toggle
**Status:** In progress

---

## Sprint Objective

Sprint 26 makes the in-memory auth prototype explicitly selectable for local development and QA.

HFOS remains local-first by default. The prototype adapter is only used when auth is enabled and `VITE_HFOS_AUTH_PROVIDER=prototype`.

---

## Planned Scope

* [x] Add `prototype` as an explicit auth provider option.
* [x] Route the auth backend factory to the in-memory adapter only for the prototype provider.
* [x] Keep unknown or production provider values disabled until implemented.
* [x] Document prototype env settings.
* [x] Keep local-first runtime behavior unchanged by default.

---

## Implementation Notes

Sprint 26 keeps auth disabled by default while allowing local QA to exercise the session shell:

* `AuthProvider` now includes `prototype`.
* `getAuthBackendAdapter()` returns `InMemoryAuthBackendAdapter` only when auth is enabled and the provider is `prototype`.
* Supabase, Firebase, and custom provider values still fall back to the disabled adapter until real adapters exist.
* `.env.example` documents the opt-in prototype settings.

---

## Security Rules

Sprint 26 should:

* Require an explicit feature flag and provider value before showing prototype auth UI.
* Keep the prototype process-local and non-persistent.
* Avoid production provider claims for Supabase, Firebase, or custom backends until those adapters exist.
* Keep local app lock separate from account session behavior.

Sprint 26 should not:

* Add production provider credentials.
* Persist sessions.
* Upload household data.
* Enable auth by default.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
