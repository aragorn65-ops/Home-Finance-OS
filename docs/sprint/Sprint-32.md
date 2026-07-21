# Home Finance OS Sprint 32

## Local Auth Link State

**Release:** v0.32.0-alpha
**Date:** July 21, 2026
**Branch:** sprint-32-local-auth-link-state
**Status:** Complete

---

## Sprint Objective

Sprint 32 marks the local household as linked after a migration checkpoint is committed.

This closes the local side of the claim and migration flow by preserving the authenticated household id, migration id, linked owner member, linked user id, and link timestamp in the household record.

---

## Planned Scope

* [x] Add optional authenticated household link metadata to local household storage.
* [x] Preserve authenticated link metadata through household serialization, loading, cloning, and backup.
* [x] Link the local owner member to the authenticated user after migration commit.
* [x] Show local link and remote household status in auth diagnostics.
* [x] Hide the claim prompt after the local household is linked.
* [x] Keep legacy and unlinked household records loadable.

---

## Implementation Summary

### Household Storage

* Added `AuthenticatedHouseholdLink` metadata on `StoredHousehold`.
* Added `linkHouseholdToAuthenticatedTenant()` to stamp the committed remote household and migration details locally.
* Updated household validation to accept both linked and unlinked records.
* Updated serialization and deserialization so authenticated link metadata remains part of local backup and restore data.

### Migration Commit Flow

* Updated `MigrationCheckpointPanel` so commit persists local authenticated-link state after the prototype remote commit succeeds.
* Linked the local owner member to the authenticated user from the migration draft.
* Preserved local-first behavior for households that have not been claimed.

### Diagnostics UI

* Added local link status to auth diagnostics.
* Added remote household id visibility when a household has been linked.
* Updated claim visibility so linked households are not prompted for repeat claims.

---

## Verification Results

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

All verification targets pass.

---

## Notes

Sprint 32 still uses the prototype auth adapter. It records the local link state needed by future sync work without making remote data the source of truth.
