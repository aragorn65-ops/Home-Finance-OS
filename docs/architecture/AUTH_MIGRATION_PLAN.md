# HFOS Local To Authenticated Storage Migration Plan

## Purpose

This plan defines how HFOS should move from local browser storage to future authenticated storage without breaking local-first usage or misassigning household financial data.

---

## Migration Principles

* Local-first HFOS remains usable before and after authenticated features are introduced.
* Migration starts as an explicit user action, not an automatic upload.
* The signed-in account that claims a local household becomes the initial household owner.
* Existing household members remain member profiles until they are invited or linked to user accounts.
* Migration must create a restorable local backup before remote writes begin.
* Failed migration must leave the local browser data usable.

---

## Proposed Migration Flow

1. User signs in.
2. HFOS detects an existing local household.
3. User chooses whether to keep local-only mode or claim the household.
4. HFOS creates a password-protectable local backup checkpoint.
5. HFOS uploads household records into a new authenticated household tenant.
6. The signed-in user is linked to the local owner member.
7. Other local members remain unlinked until invited.
8. HFOS verifies record counts and summary totals after upload.
9. HFOS marks the local household as linked to the authenticated household.

---

## Data Mapping

| Local Concept | Future Authenticated Concept |
| --- | --- |
| Household record | Household tenant |
| Household member | Household member profile |
| `HouseholdMember.userId` | Linked authenticated user ID |
| Local role | Membership role |
| Account visibility | Backend record visibility rule |
| Local backup | Migration checkpoint and restore artifact |
| Google Drive backup | Optional user-managed backup source |

---

## Ownership Checks

Before importing or claiming data:

* The importing user must be signed in.
* The user must confirm they have authority to claim the household.
* The import must show a summary before writing remote records.
* Existing authenticated households must require owner approval before merge/import.
* Backup files must not silently overwrite a shared household.

---

## Rollback Strategy

The first implementation should preserve local data until remote migration is verified. If upload or verification fails, HFOS should:

* Keep local records untouched.
* Clear any partial remote migration batch where possible.
* Show the failure reason.
* Offer retry from the same local data.

Once remote use is stable, HFOS may offer a cleanup option, but it should not delete local data automatically.

---

## Deferred Decisions

* Whether remote records become the source of truth immediately after migration.
* Whether sync uses whole-package replacement or record-level changes.
* Whether Google Drive backups can be attached to authenticated accounts.
* How account recovery works when a household has only one owner.
