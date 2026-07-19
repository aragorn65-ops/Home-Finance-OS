# Home Finance OS Sprint 24

## Remote Tenant Contracts

**Release:** v0.24.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-24-remote-tenant-contracts
**Status:** In progress

---

## Sprint Objective

Sprint 24 adds the first backend-facing tenant and migration contracts for future authenticated HFOS.

This sprint still does not add production backend persistence. The goal is to define the interfaces that a future provider must implement for household tenants, memberships, invitations, private-record checks, and migration commit/abort behavior.

---

## Planned Scope

* [x] Add remote household tenant persistence contracts.
* [x] Add owner/admin/member enforcement contracts.
* [x] Add invitation and membership command contracts.
* [x] Add private-record authorization helpers beyond accounts.
* [x] Add migration draft, commit, and abort contracts.
* [x] Keep local-first runtime behavior unchanged.

---

## Implementation Notes

Sprint 24 adds provider-neutral contracts only:

* `RemoteHousehold`, `RemoteTenantRecord`, and migration models define future backend data boundaries.
* `RemoteTenantRepository` describes household, membership, invitation, and role commands.
* `RemoteMigrationRepository` describes migration draft, validation, commit, and abort commands.
* Disabled remote repositories keep local-first runtime behavior unchanged.
* `canAccessTenantRecord` generalizes private-record checks beyond accounts.

---

## Security Rules

Sprint 24 should:

* Require household tenant IDs on remote records.
* Treat backend enforcement as mandatory for future shared data.
* Keep frontend authorization helpers as UX guidance only.
* Keep disabled adapters non-persistent and non-networked.

Sprint 24 should not:

* Add production remote storage.
* Upload household data.
* Enable background sync.
* Treat local app lock as a backend session.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
