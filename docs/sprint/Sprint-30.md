# Home Finance OS Sprint 30

## Household Claim Flow UI

**Release:** v0.30.0-alpha
**Date:** July 21, 2026
**Branch:** sprint-30-household-claim-flow
**Status:** In progress

---

## Sprint Objective

Sprint 30 builds the household claim flow UI, allowing signed-in prototype users to claim an existing local household and prepare it for remote migration.

The claim flow should show a summary before proceeding, create a migration checkpoint backup, and refresh diagnostics to reflect the claim status.

---

## Planned Scope

* [ ] Add household claim flow component behind auth feature flag.
* [ ] Display existing local household summary in claim UI.
* [ ] Show claim confirmation with household ownership transfer.
* [ ] Create migration checkpoint backup before claim commit.
* [ ] Update auth diagnostics to show claim status.
* [ ] Keep local-first mode available for unsigned users.
* [ ] Complete visual QA for default and signed-in claim flow.

---

## Security Rules

Sprint 30 should:

* Require sign-in before household claim.
* Create a restorable backup checkpoint before marking claim.
* Show household name and basic member count before claim.
* Keep the claim flow feature-flagged with auth.

Sprint 30 should not:

* Upload data to remote storage.
* Add production auth provider UI.
* Persist authenticated session across browser restart.
* Require Google Drive or other external services.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```

Visual QA should include:

* Confirm household claim UI only shows when signed in.
* Confirm claim summary displays correct household name.
* Confirm claim summary shows member count.
* Confirm claim creates a restorable backup checkpoint.
* Confirm claim updates diagnostics to reflect membership.
* Confirm default local-first flow remains unchanged.

---

## Notes

The household claim flow builds on Sprint 29's prototype auth QA foundation. The claim UI will integrate with the existing auth diagnostics panel and prepare the data model for Sprint 31's migration checkpoint and remote persistence.

Claim flow should use the `createHouseholdClaimDraft()` method from the auth backend adapter, which was prepared in earlier sprints but is not yet exercised from the UI layer.
