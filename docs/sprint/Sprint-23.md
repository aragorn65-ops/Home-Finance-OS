# Home Finance OS Sprint 23

## Auth Session Shell

**Release:** v0.23.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-23-auth-session-shell
**Status:** In progress

---

## Sprint Objective

Sprint 23 adds the first feature-flagged auth session shell.

HFOS should remain local-first by default. When future auth is enabled through environment configuration, the app shell can show a provider-neutral sign-in/sign-out surface and session state without adding a production backend or migrating data.

---

## Planned Scope

* [x] Add a provider-neutral auth client factory.
* [x] Add a React auth session hook.
* [x] Add sign-in/sign-out adapter methods.
* [x] Add a feature-flagged header auth control.
* [x] Keep auth UI hidden when auth is disabled.
* [x] Keep local app lock behavior separate from account session behavior.

---

## Implementation Notes

Sprint 23 adds the auth session shell without changing the default local-first experience:

* `getAuthBackendAdapter()` returns the disabled adapter until a real provider is selected.
* `useAuthSession()` loads session state and exposes sign-in/sign-out commands for future provider adapters.
* `AuthSessionButton` is only rendered by the header when auth is explicitly feature-enabled.
* Local app lock remains the only active privacy control in normal alpha builds.

---

## Security Rules

Sprint 23 should:

* Keep auth disabled unless `VITE_HFOS_AUTH_ENABLED=true`.
* Avoid storing tokens in local storage.
* Treat disabled/custom placeholder auth as non-production.
* Keep browser app lock independent from account sign-in.

Sprint 23 should not:

* Add production provider credentials.
* Upload household data.
* Claim server-side authorization exists.
* Require sign-in for local-first HFOS.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
