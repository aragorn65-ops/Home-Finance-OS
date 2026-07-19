# Home Finance OS Sprint 22

## Auth Foundation Contracts

**Release:** v0.22.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-22-auth-foundation
**Status:** In progress

---

## Sprint Objective

Sprint 22 starts the auth implementation path by adding feature-flagged frontend contracts for future authenticated HFOS.

This sprint should not add a live backend, sign-in UI, or data migration. The goal is to make the local-first app auth-ready with clear provider configuration, domain models, authorization helpers, backend adapter interfaces, and migration preview contracts.

---

## Planned Scope

* [x] Add auth provider selection and environment configuration notes.
* [x] Add authenticated session shell interfaces behind a feature flag.
* [x] Add domain types for `User`, `HouseholdMembership`, and invitations.
* [x] Add authorization helper contracts for household and private-record checks.
* [x] Add backend adapter interfaces without binding HFOS to one provider.
* [x] Add migration preview models using the existing backup summary.
* [x] Keep local-first mode as the default runtime path.

---

## Implementation Notes

Sprint 22 adds contract-level auth readiness only:

* `frontend/src/config/auth.ts` keeps auth disabled unless `VITE_HFOS_AUTH_ENABLED=true` and a supported provider is selected.
* `frontend/src/features/auth/models/` defines future user, session, membership, invitation, and migration preview shapes.
* `frontend/src/features/auth/services/authorization.ts` centralizes frontend role checks for future UI gating.
* `frontend/src/features/auth/services/AuthBackendAdapter.ts` defines the provider-neutral backend contract.
* `DisabledAuthBackendAdapter` preserves local-first behavior as the default.

---

## Security Rules

Sprint 22 should:

* Keep local app lock separate from account authentication.
* Keep all auth runtime behavior disabled unless explicitly feature-flagged.
* Avoid storing account tokens or provider secrets in browser local storage.
* Treat frontend authorization helpers as UI guidance only until a backend enforces them.
* Preserve current local-first startup and household flows.

Sprint 22 should not:

* Add production backend login.
* Upload local data to a remote service.
* Require account login to use HFOS.
* Claim role-based security without server enforcement.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
