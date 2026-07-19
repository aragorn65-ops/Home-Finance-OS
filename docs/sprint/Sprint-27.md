# Home Finance OS Sprint 27

## Auth Prototype Diagnostics

**Release:** v0.27.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-27-auth-diagnostics
**Status:** In progress

---

## Sprint Objective

Sprint 27 adds diagnostics for the feature-flagged auth prototype.

The diagnostics layer should make local QA and future tests able to inspect auth mode, session status, adapter capability, membership count, and invitation count without reaching into adapter internals.

---

## Planned Scope

* [x] Add auth diagnostics model.
* [x] Add diagnostics service for current auth adapter state.
* [x] Add React diagnostics hook for future QA UI.
* [x] Expose diagnostics through auth feature exports.
* [x] Keep diagnostics read-only.
* [x] Keep default local-first behavior unchanged.

---

## Implementation Notes

Sprint 27 adds read-only auth diagnostics:

* `AuthDiagnostics` reports enabled state, provider, session status, adapter type, membership count, and invitation count.
* `createAuthDiagnostics()` reads the current auth adapter without exposing tokens or secrets.
* `useAuthDiagnostics()` gives future QA UI a React-friendly diagnostics API.
* Diagnostics are exported from the auth feature but are not rendered in production UI.

---

## Security Rules

Sprint 27 should:

* Avoid exposing tokens or secrets.
* Report provider/config state without making network calls.
* Treat prototype diagnostics as QA information only.
* Keep local app lock separate from auth session behavior.

Sprint 27 should not:

* Persist diagnostic state.
* Upload household data.
* Add production auth provider behavior.
* Make sign-in required for local-first HFOS.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
