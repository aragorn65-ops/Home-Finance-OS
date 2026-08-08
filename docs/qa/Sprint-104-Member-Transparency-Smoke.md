# Sprint 104 Member Transparency Smoke

Use this guide on the deployed production URL after the latest `main`
deployment is available.

```text
https://home-finance-os.pages.dev
```

Use sample or low-risk data only.

---

## Purpose

Confirm limited member access is transparent enough for household review while
still read-only for management workflows. Members can record settlement
payments only when they are the payer or receiver. Viewers can review records
but cannot record settlements.

---

## Prerequisites

* Admin account is signed in and linked to the target household.
* Household has at least two active members.
* The tested member has an accepted invitation and an active Supabase
  membership linked to their local household member record.
* The household has sample accounts, transactions, utility provider bills,
  savings goals, and at least one unsettled allocation involving the tested
  member.
* The latest Supabase schema has been applied and PostgREST schema cache has
  been reloaded.
* Production is deployed at commit `288331a` or newer for member personal
  account visibility after save/re-entry, settlement member-alias
  authorization, and member settlement save continuation after an admin-only
  core snapshot pre-save refusal.

---

## Member Sign-In

1. Sign out of the admin account.
2. Sign in with the invited member account.
3. Open Settings and refresh Auth Diagnostics.
4. Confirm Session is `signed-in`.
5. Confirm Role is `member`.

Expected result: member session is active and does not show an admin access
block on transparency routes.

---

## Member Route Review

Open and refresh each route:

```text
/app
/app/household-members
/app/accounts
/app/transactions
/app/utilities
/app/settlements
/app/savings
/app/analytics
/app/help-center
/app/settings
```

Expected result: every route loads without a Cloudflare 404, blank app shell,
or chunk-load error.

---

## Member Read-Only Controls

Confirm these controls are not visible or cannot be used:

* Accounts: Add, Edit, Delete.
* Transactions: Add, Edit, Delete.
* Utilities: provider bill create/edit/delete, bill file add/remove, mark paid.
* Savings: goal create/edit/archive/delete and activity create/edit/delete.
* Household Members: invite, role change, remove, ownership transfer.
* Settings: household preferences, backup/restore, reset, migration, and schema
  write actions.

Expected result: member can review records without management controls.

---

## Member Personal Account Visibility

1. Open Accounts as the member.
2. Confirm household accounts are visible.
3. Confirm the signed-in member's own personal accounts are visible.
4. Confirm personal accounts owned by other members are not visible.
5. Open a payment selector in a permitted settlement entry.
6. Confirm household accounts plus the selected member's personal accounts are
   available.

Expected result: personal accounts are owner-only, while household accounts
remain visible for household workflows.

---

## Member Settlement Entry

1. Open Settlements.
2. Select the intended payment month.
3. Click Record Settlement.
4. Create a settlement where the signed-in member is either payer or receiver.
5. In manual mode, select applicable allocation rows if needed.
6. Save the settlement.
7. Refresh the browser.
8. Confirm the settlement remains in history for the selected payment month.

Expected result: involved-member settlement entry saves and reloads from the
cloud-backed store.

If the save fails with `Only a household admin can save core finance records`,
the deployed build is older than the member settlement checkpoint.

---

## Member Settlement Restrictions

1. Try to create a settlement where the signed-in member is neither payer nor
   receiver.
2. Confirm the save is blocked with a clear validation or authorization message.
3. Confirm existing settlement history shows View but not Edit or Delete.

Expected result: members can only record involved settlements and cannot revise
or delete settlement history.

---

## Viewer Smoke

If a viewer role is available:

1. Sign in as viewer.
2. Open the transparency routes listed above.
3. Confirm Accounts, Transactions, Utilities, Settlements, Savings, Analytics,
   Help, Household Members, and Settings load for review.
4. Confirm Record Settlement is not visible.
5. Confirm management controls are not visible.

Expected result: viewer access is review-only.

---

## Admin Review Of Member Settlement

1. Sign out of the member account.
2. Sign in as admin.
3. Open Settlements for the same payment month.
4. View the member-submitted settlement.
5. Edit a safe non-financial field such as notes or reference number.
6. Save and refresh.
7. Delete the test settlement if it was created only for smoke testing.

Expected result: admin can review, correct, and remove member-submitted
settlements.

---

## Evidence Log

Record the result in `docs/qa/Public-Beta-Launch-Evidence.md`.

```text
Date:
Tester:
Production URL: https://home-finance-os.pages.dev
Expected build commit:
Member account:
Member Auth Diagnostics role:
Member route review:
Member read-only controls:
Member personal account visibility:
Member involved settlement entry:
Member uninvolved settlement block:
Member settlement edit/delete hidden:
Viewer route review, if tested:
Viewer Record Settlement hidden, if tested:
Admin review/edit/delete of member settlement:
Blockers:
Decision:
```
