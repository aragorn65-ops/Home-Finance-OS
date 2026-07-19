# Home Finance OS Sprint 25

## Auth Adapter Prototype

**Release:** v0.25.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-25-auth-adapter-prototype
**Status:** In progress

---

## Sprint Objective

Sprint 25 adds an executable in-memory auth and tenant adapter for future tests and provider prototyping.

This sprint still does not add production login, remote storage, or cloud sync. The goal is to prove that the Sprint 22-24 contracts can be exercised safely without touching local-first runtime data.

---

## Planned Scope

* [x] Add in-memory auth backend adapter.
* [x] Add in-memory tenant repository behavior.
* [x] Add in-memory migration repository behavior.
* [x] Keep prototype state process-local and non-persistent.
* [x] Keep default runtime auth adapter disabled.
* [x] Document prototype limitations.

---

## Implementation Notes

Sprint 25 adds executable prototype behavior without wiring it into production runtime:

* `InMemoryAuthStore` keeps process-local auth, household, membership, invitation, and migration state.
* `InMemoryAuthBackendAdapter` exercises the `AuthBackendAdapter` contract.
* `InMemoryRemoteTenantRepository` exercises household, membership, invitation, and role commands.
* `InMemoryRemoteMigrationRepository` exercises migration draft, validation, commit, and abort commands.
* `getAuthBackendAdapter()` still returns the disabled adapter by default, so local-first HFOS behavior is unchanged.

---

## Security Rules

Sprint 25 should:

* Treat the in-memory adapter as test/prototype only.
* Avoid browser storage, network calls, and provider credentials.
* Keep disabled auth as the production default.
* Keep local app lock separate from auth session behavior.

Sprint 25 should not:

* Enable production sign-in.
* Persist account sessions.
* Upload household data.
* Claim server-side authorization exists.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
