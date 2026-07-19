# ADR-006: Future Authentication Architecture

## Status

Proposed

---

## Date

2026-07-19

---

## Context

HFOS is currently a local-first browser application. Sprint 20 added local app lock and optional password-protected backups, but those controls do not create account identity, server-side authorization, household membership enforcement, or cross-device sync.

The existing data model already has household IDs, household members, roles, member-owned private accounts, and shared financial records. Future authentication must preserve those concepts while moving enforcement out of the browser and into a trusted backend.

---

## Decision

HFOS will treat future authentication as three separate layers:

1. Account identity: who signed in.
2. Household authorization: which households that account may access.
3. Local privacy: whether the current browser session is locally locked.

The first authenticated backend should enforce household tenancy before returning or mutating any household record. Browser-side role checks may improve UX, but they are not security boundaries.

HFOS should keep local-first usage available until authenticated storage is deliberately introduced and migration is tested.

---

## Target Model

The future model should include:

* `User`: authenticated account identity from a backend auth provider.
* `Household`: tenant boundary for financial data.
* `HouseholdMember`: display/member profile inside one household.
* `HouseholdMembership`: join between user, household, member profile, role, and invitation status.
* `Session`: backend-authenticated browser session.
* `LocalAppLock`: optional browser privacy control, independent from account login.

Current `HouseholdMember.userId` can become the link from local household member records to authenticated users during migration.

---

## Role Direction

Initial authenticated roles should map from the existing local roles:

* `owner`: full household control, billing/future admin, membership, backup import approval, and ownership transfer.
* `admin`: household data management and invitations, but not ownership transfer or destructive household deletion.
* `member`: normal household participation with access limited by record visibility.

A future `viewer` role can be added when read-only sharing is needed, but it should not be exposed until the backend enforces it.

---

## Security Rules

* Every shared record must belong to exactly one household tenant.
* Every backend request must prove the signed-in user has an active membership in that household.
* Private records must check both household membership and member ownership.
* Deleted or inactive memberships must lose access immediately on the server.
* Backup import into an authenticated household must require owner approval.
* Local app lock must never be used as proof of account identity.

---

## Consequences

### Positive

* Keeps local privacy and account authorization distinct.
* Preserves the current member-centered household model.
* Allows staged migration from local storage to backend storage.
* Avoids shipping role labels before enforcement exists.

### Negative

* Backend implementation cannot be safely started until tenant and migration rules are finalized.
* Existing local-only records need an ownership-claim flow before they can become shared account data.
* More product decisions are needed for ownership transfer, recovery, and conflict handling.

---

## Alternatives Considered

### Option A: Treat local app lock as login

Rejected. Local app lock protects the current browser only and cannot authorize shared household data.

### Option B: Add login before household tenancy

Rejected. Login without tenant enforcement would create a false sense of security.

### Option C: Store only encrypted backup packages in the backend

Deferred. This may be a low-risk first cloud feature, but it does not support shared live household workflows.

---

## Related Documents

* `docs/architecture/FUTURE_AUTH_PATH.md`
* `docs/architecture/AUTH_MIGRATION_PLAN.md`
* `docs/architecture/HOUSEHOLD_ROLES_AND_PERMISSIONS.md`
* `docs/architecture/CLOUD_SYNC_CONFLICT_POLICY.md`
