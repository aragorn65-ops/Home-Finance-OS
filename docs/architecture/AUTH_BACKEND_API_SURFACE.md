# HFOS Minimum Auth Backend API Surface

## Purpose

This document identifies the minimum backend/API surface needed before HFOS can safely implement authenticated household data.

It is intentionally small. The first backend should prove identity, tenancy, migration, and private-record authorization before adding broad sync automation.

---

## Required Domains

### Identity

* Sign in.
* Sign out.
* Read current user profile.
* Refresh/validate session.

### Households

* Create household tenant.
* Read households available to current user.
* Read one household by ID.
* Update household settings.
* Delete household, owner only.

### Membership

* List members and memberships for a household.
* Invite a user to a household.
* Accept or decline an invitation.
* Change a member role.
* Deactivate or remove a member.
* Transfer ownership.

### Records

Each household-scoped record API must enforce tenant access:

* Accounts.
* Transactions.
* Expense allocations.
* Utility provider bills.
* Settlements.
* Settlement applications.
* Savings goals.
* Savings activities.

Private records must also enforce member ownership or explicit sharing.

### Migration

* Create migration draft from local backup summary.
* Upload migration batch.
* Validate migrated counts and totals.
* Commit migration.
* Abort migration and clean partial remote records.

### Backup Restore

* Preview backup metadata.
* Request owner approval for shared-household restore.
* Restore into a new household.
* Restore into an existing household after approval.

---

## Required Server Checks

Every write must verify:

* The user is signed in.
* The user has active membership in the household.
* The role allows the action.
* The record belongs to the same household tenant.
* Private record access is limited to the linked member or explicit grant.

---

## Out Of Scope For First Backend

* Billing.
* Multi-household analytics.
* Fully automatic background sync.
* Organization administration.
* Public sharing links.
* Account recovery beyond the chosen identity provider.
