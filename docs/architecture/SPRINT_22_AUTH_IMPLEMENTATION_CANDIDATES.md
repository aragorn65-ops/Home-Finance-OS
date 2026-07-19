# Sprint 22 Auth Implementation Candidates

## Purpose

This document turns Sprint 21 planning into candidate implementation milestones for Sprint 22 and beyond.

---

## Recommended Sprint 22 Scope

Sprint 22 should build an auth-ready foundation without migrating production data yet.

Recommended candidates:

* Add auth provider selection and environment configuration notes.
* Add authenticated session shell interfaces behind a feature flag.
* Add domain types for `User`, `HouseholdMembership`, and invitations.
* Add authorization helper contracts for household and private-record checks.
* Add backend adapter interfaces without binding the app to one provider.
* Add migration preview models using the existing backup summary.
* Keep local-first mode as the default runtime path.

---

## Sprint 23 Candidates

* Implement sign-in/sign-out UI behind a feature flag.
* Link signed-in user identity to local owner member.
* Create household claim flow for existing local data.
* Add migration checkpoint backup before remote writes.
* Add integration tests for authorization helper behavior.

---

## Sprint 24 Candidates

* Add first remote household tenant persistence.
* Add owner/admin/member enforcement in backend rules.
* Add invite and membership acceptance flow.
* Add private-account authorization checks.
* Add migration commit/abort behavior.

---

## Deferral Guidance

Defer these until the basic authenticated tenant model works:

* Full automatic multi-device sync.
* Viewer role UI.
* Ownership transfer UI.
* Account recovery design.
* Cloud restore into existing shared households.
* Background conflict resolution.
