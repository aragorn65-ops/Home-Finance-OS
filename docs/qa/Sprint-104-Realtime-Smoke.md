# Sprint 104 Realtime Smoke

Use this guide after Cloudflare Pages deploys the latest `main` checkpoint.

```text
https://home-finance-os.pages.dev
```

Use sample or low-risk data only.

---

## Purpose

Confirm the active signed-in browser session receives cloud-backed household
changes without manual refresh. This is limited to the public beta baseline:
household preferences, core finance snapshots, utility provider bills, and
settlement records.

Multi-device collaboration and conflict resolution remain out of scope.

---

## Build Gate

1. Open `/app/settings`.
2. Open Auth Diagnostics.
3. Confirm Build is `3a7b065` or newer.
4. Confirm Branch is `main`.
5. Confirm Cloud Schema Readiness passes for household preferences, core
   snapshot, settlement RPCs, and realtime checks.

Expected result: production is running the intended Sprint 104 realtime
checkpoint before the smoke pass starts.

---

## Setup

1. Sign in as owner/admin.
2. Open the app in two browser tabs using the same signed-in admin session.
3. In both tabs, use the same selected reporting month.
4. Keep Tab A as the writer and Tab B as the observer.

Expected result: both tabs show the same household before any test change.

---

## Household Preferences

1. In Tab B, open Settings and note the current household display preference
   being tested, such as theme or household settings visible in the public beta
   scope.
2. In Tab A, change the same preference.
3. Save if the UI requires saving.
4. Watch Tab B without refreshing.

Expected result: Tab B updates from the cloud-backed household preference
subscription, or shows a clear reload/sync state if the change cannot be
applied live.

---

## Core Snapshot

1. In Tab B, open Accounts or Transactions.
2. In Tab A, create a small test account or transaction.
3. Wait for the cloud save to complete.
4. Watch Tab B without refreshing.

Expected result: Tab B reflects the updated core snapshot without relying on
manual refresh.

---

## Utility Provider Bills

1. In Tab B, open Utilities.
2. In Tab A, add a small unpaid utility provider bill.
3. Wait for save completion.
4. Watch Tab B without refreshing.

Expected result: Tab B receives the updated cloud core snapshot and shows the
new provider bill.

---

## Settlements

1. In Tab B, open Settlements for the selected payment month.
2. In Tab A, record a small involved settlement.
3. Wait for save completion.
4. Watch Tab B without refreshing.
5. In Tab A, edit or delete the test settlement as admin if cleanup is needed.

Expected result: Tab B receives settlement realtime changes for create,
update, and delete events.

---

## Failure Handling

If Tab B does not update:

1. Confirm both tabs are signed in to the same admin account.
2. Confirm both tabs are linked to the same household.
3. Confirm Settings Auth Diagnostics still reports a valid session.
4. Confirm Cloud Schema Readiness passes.
5. Refresh Tab B and confirm the saved change exists after reload.

Expected result: any realtime failure is isolated from persistence. Data should
still reload from the cloud-backed source of truth after refresh.

---

## Evidence Log

Record the result in `docs/qa/Public-Beta-Launch-Evidence.md`.

```text
Date:
Tester:
Browser:
Production URL: https://home-finance-os.pages.dev
Expected build commit: 3a7b065 or newer
Auth Diagnostics build:
Auth Diagnostics branch:
Cloud Schema Readiness:
Household preference realtime:
Core snapshot realtime:
Utility provider bill realtime:
Settlement create realtime:
Settlement update/delete realtime:
Refresh fallback result, if needed:
Blockers:
Decision:
```
