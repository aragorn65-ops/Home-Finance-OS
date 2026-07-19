# Home Finance OS Sprint 21

## Authentication Architecture Planning

**Release:** v0.21.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-21-auth-planning
**Status:** Planning

---

## Sprint Objective

Sprint 21 turns the Sprint 20 security readiness work into a concrete future-auth architecture plan.

The goal is not to ship backend login yet. The goal is to decide how HFOS will eventually support authenticated accounts, household membership, role-aware access, and cloud sync without breaking the current local-first app or overstating the protection provided by local app lock.

---

## Starting Point

Sprint 20 shipped:

* Local app lock with PIN hash storage.
* Manual lock, refresh lock, and inactivity lock.
* Privacy/session controls in Settings.
* Normal local backup export/import.
* Optional password-protected backup export/import.
* Google Drive compatibility for normal and protected backup files.
* Future full-auth boundary notes in `docs/architecture/FUTURE_AUTH_PATH.md`.

HFOS remains local-first. App lock protects casual access in the current browser, and protected backups encrypt files before they leave the browser. Neither feature creates identity, account recovery, authorization, or multi-device sync.

---

## Planned Scope

Sprint 21 candidates include:

* [x] Choose the target auth model for future HFOS accounts.
* [x] Define household ownership, invitations, membership, and removal rules.
* [x] Define roles and permissions for owner, admin, member, and future viewer roles.
* [x] Document tenant boundaries for household records.
* [x] Define the migration path from local browser storage to authenticated storage.
* [x] Define how local app lock coexists with account login.
* [x] Define backup import ownership checks for a future backend.
* [x] Define cloud sync conflict rules at a product and data-model level.
* [x] Identify the minimum backend/API surface required before implementation.
* [x] Split implementation candidates into Sprint 22+ milestones.

---

## Security Rules

Sprint 21 should:

* Preserve local-first HFOS usage while auth is still future work.
* Treat account login, household authorization, and local app lock as separate concepts.
* Require server-side household access checks before any shared data is trusted.
* Avoid storing sensitive account or household secrets in plain browser storage.
* Keep password-protected backup behavior understandable and recoverability limits clear.
* Make migration reversible until authenticated storage is proven.

Sprint 21 should not:

* Add a backend before identity, tenancy, and migration rules are settled.
* Replace local app lock with login semantics.
* Require Google Drive or Google login for normal local HFOS use.
* Introduce role labels that are not backed by enforceable permissions.
* Import backup data into a shared account without ownership and consent checks.

---

## Planning Deliverables

* [x] Auth architecture decision record.
* [x] Household membership and role matrix.
* [x] Local-to-authenticated data migration plan.
* [x] Backup ownership and restore policy.
* [x] Cloud sync conflict policy.
* [x] Sprint 22 implementation candidate list.

---

## Planning Artifacts

* `docs/decisions/ADR-006-authentication-architecture.md`
* `docs/architecture/HOUSEHOLD_ROLES_AND_PERMISSIONS.md`
* `docs/architecture/AUTH_MIGRATION_PLAN.md`
* `docs/architecture/BACKUP_OWNERSHIP_POLICY.md`
* `docs/architecture/CLOUD_SYNC_CONFLICT_POLICY.md`
* `docs/architecture/AUTH_BACKEND_API_SURFACE.md`
* `docs/architecture/SPRINT_22_AUTH_IMPLEMENTATION_CANDIDATES.md`

---

## Open Questions

* Which identity provider should HFOS target first?
* Should the first backend store all records, only sync metadata, or only encrypted backup packages?
* How should household ownership transfer work?
* Can a household member have account access without seeing all historical records?
* How should existing local households map to the first authenticated owner?
* What is the minimum useful account feature: sign-in, backup ownership, multi-device sync, or household sharing?

---

## Verification Targets

Sprint 21 is a planning sprint, so verification should focus on docs consistency and implementation readiness:

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Manual QA should include:

* Confirm Sprint 21 docs do not describe local app lock as account authentication.
* Confirm the future auth plan keeps local-first use available.
* Confirm each proposed implementation milestone has clear data ownership and rollback expectations.
