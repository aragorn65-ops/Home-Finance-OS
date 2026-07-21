# Home Finance OS Sprint 31

## Migration Checkpoint Remote Persistence

**Release:** v0.31.0-alpha
**Date:** July 21, 2026
**Branch:** sprint-31-migration-checkpoint-remote-persistence
**Status:** Complete

---

## Sprint Objective

Sprint 31 makes the prototype household migration checkpoint observable after a household is claimed.

The auth prototype now stages the claimed household as a remote migration draft, exposes the checkpoint in diagnostics, validates the staged record counts, and commits the checkpoint against the same remote household created by the claim flow.

---

## Planned Scope

* [x] Track migration drafts in the auth adapter contract.
* [x] Preserve the claimed remote household id through migration commit.
* [x] Add prototype migration draft listing, validation, commit, and abort actions.
* [x] Surface migration draft count and latest status in auth diagnostics.
* [x] Add a migration checkpoint panel for signed-in prototype users.
* [x] Keep the flow feature-flagged with auth and local-first safe by default.

---

## Implementation Summary

### Auth Contracts

* Extended `AuthBackendAdapter` with migration draft listing, validation, commit, and abort methods.
* Extended `RemoteMigrationRepository` with draft listing.
* Added migration draft metadata for `householdId`, staged record count, and lifecycle timestamps.
* Updated disabled adapters to return safe empty migration state when auth is unavailable.

### Prototype Persistence

* Updated `InMemoryRemoteMigrationRepository` to stage claimed households as uploaded migration drafts.
* Added validation that moves uploaded drafts to validated status.
* Added commit behavior that reuses the claimed remote household id rather than creating a second household id.
* Added abort behavior that records an aborted timestamp without deleting the checkpoint record.

### Diagnostics UI

* Added `MigrationCheckpointPanel` for signed-in prototype users.
* Added validate, commit, and abort controls with disabled states based on draft lifecycle.
* Added migration draft count and latest migration status to `AuthDiagnosticsPanel`.

---

## Verification Results

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

All verification targets pass.

Visual QA completed with auth enabled at desktop and mobile widths:

* Confirmed signed-in claim flow renders the household summary and confirmation state.
* Confirmed migration checkpoints render uploaded, validated, and committed states.
* Confirmed the claim panel is hidden after the signed-in user has a migration membership.
* Confirmed auth diagnostics actions do not overlap on desktop or mobile.
* Confirmed long remote household and checkpoint ids wrap without horizontal overflow.
