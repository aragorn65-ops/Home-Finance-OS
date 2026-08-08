# Public Beta Launch Evidence

Use this ledger beside `docs/qa/Public-Beta-Launch-Checklist.md`.

The checklist remains the launch decision source. This file records which gates
have repo-side evidence and which gates still require live Cloudflare Pages or
Supabase validation before inviting public beta testers.

---

## Repo-Verified Gates

* Public beta safety banner:
  `frontend/src/app/AppShell/AppShell.tsx`
* Settings Data & Backup safety note:
  `frontend/src/features/settings/pages/SettingsPage.tsx`
* Local backup export, validation preview, and restore:
  `frontend/test/applicationBackup.test.ts`
* Clear Test Data and Reset All Application Data:
  `frontend/test/applicationDataReset.test.ts`
* Google Drive backup configured/unconfigured status:
  `frontend/test/googleDriveBackupStatus.test.ts`
* Public beta route-smoke scope:
  `frontend/src/app/router/publicBetaSmokeRoutes.ts` and
  `frontend/test/publicBetaSmokeRoutes.test.ts`
* Signed-out route blocking and limited member route access:
  `frontend/test/authRouteAccess.test.ts` and
  `frontend/test/publicBetaSmokeRoutes.test.ts`
* Member route access remains limited to transparency routes across the public
  beta smoke route manifest:
  `frontend/test/publicBetaSmokeRoutes.test.ts`
* Household Members is available as a member transparency route, while
  management controls remain owner/admin-only:
  `frontend/src/features/auth/services/authRouteAccess.ts` and
  `frontend/src/features/household/pages/HouseholdMembersPage.tsx`
* Accounts is available as a read-only member transparency route, while
  personal accounts remain visible only to the owning member and account
  management controls remain owner/admin-only:
  `frontend/src/features/auth/services/authRouteAccess.ts`,
  `frontend/src/features/accounts/pages/AccountsPage.tsx`, and
  `frontend/test/accountVisibility.test.ts`
* Member personal account creation keeps the signed-in member as the effective
  owner and authorizes the saved local account against the local household id:
  `frontend/src/features/accounts/pages/AccountsPage.tsx`
* Linked member re-entry preserves local personal accounts saved under a
  previous local household shell:
  `frontend/src/features/accounts/repositories/AccountRepository.ts` and
  `frontend/test/browserCoreSnapshotLocalWriter.test.ts`
* Member account visibility accepts local, linked-shell, and Supabase owner id
  aliases for the signed-in member:
  `frontend/src/features/accounts/pages/AccountsPage.tsx` and
  `frontend/test/authorization.test.ts`
* Member account creation no longer falls back to the admin household owner
  when choosing the default account owner:
  `frontend/src/features/accounts/pages/AccountsPage.tsx`
* Member-created personal accounts are archived locally and merged back after
  cloud core snapshot restore so refresh does not hide or erase them:
  `frontend/src/features/accounts/repositories/AccountRepository.ts`,
  `frontend/src/shared/storage/localStorageStore.ts`, and
  `frontend/test/browserCoreSnapshotLocalWriter.test.ts`
* Member settlement creation skips only the admin-only core snapshot pre-save
  refusal and still relies on the settlement RPC for involved-member
  authorization:
  `frontend/src/features/settlements/services/settlementCoreSnapshotSave.ts`,
  `frontend/src/features/settlements/hooks/useSettlements.ts`, and
  `frontend/test/settlementCoreSnapshotSave.test.ts`
* Single-household authenticated-link conflicts are blocked before local link
  state can be overwritten:
  `frontend/test/householdStorage.test.ts`
* Settlement role authorization:
  `frontend/test/authorization.test.ts` and
  `frontend/test/remoteSettlementPersistence.test.ts`
* Member settlement access accepts local member aliases for involved-member
  create and view authorization:
  `frontend/src/features/auth/services/authorization.ts`,
  `frontend/src/features/settlements/pages/SettlementsPage.tsx`, and
  `frontend/test/authorization.test.ts`
* Member/viewer tenant-record access is read-only in the shared authorization
  helper, including owner-only personal account visibility:
  `frontend/src/features/auth/services/authorization.ts` and
  `frontend/test/authorization.test.ts`
* Admin review/edit/delete of member-submitted settlement records:
  `frontend/test/remoteSettlementPersistence.test.ts`
* Manual settlement partial-payment application:
  `frontend/test/settlementPartialApplications.test.ts`
* Supabase core snapshots include expense allocations and settlements refresh
  the core snapshot before remote save:
  `frontend/test/coreSnapshotSync.test.ts` and
  `frontend/test/supabaseAuthBackendAdapter.test.ts`
* Cloud snapshot restore preserves local allocations when an older or
  incomplete remote snapshot has transactions but no allocation rows:
  `frontend/test/coreSnapshotSync.test.ts`
* Household metadata cloud persistence contract:
  `frontend/test/remoteHouseholdPreferencesPersistence.test.ts`
* Account, transaction, and expense-allocation cloud snapshot contract:
  `frontend/test/remoteCoreSnapshotPersistence.test.ts` and
  `frontend/test/coreSnapshotSync.test.ts`
* Utility provider bills are included in the cloud core snapshot contract:
  `frontend/test/coreSnapshotSync.test.ts`,
  `frontend/test/supabaseAuthBackendAdapter.test.ts`, and
  `frontend/test/supabaseSchemaSql.test.ts`
* Public beta cloud persistence scope covers household metadata, core finance
  snapshots, utility provider bills, and settlement records:
  `docs/sprint/Sprint-102.md` and
  `docs/qa/Public-Beta-Launch-Checklist.md`
* Cloud core snapshot write failures surface instead of being reported as saved:
  `frontend/test/coreSnapshotSync.test.ts`
* Supabase RPC wiring and realtime subscription contracts:
  `frontend/test/supabaseAuthBackendAdapter.test.ts`
* Settings Cloud Schema Readiness probes the public beta tables plus household
  preferences, core snapshot, and settlement RPC visibility:
  `frontend/test/supabaseAuthBackendAdapter.test.ts`
* Production auth readiness diagnostics:
  `frontend/test/createAuthDiagnostics.test.ts`
* Metadata-only attachment payload and edit validation coverage:
  `frontend/test/attachmentMetadataRecords.test.ts` and
  `frontend/test/transactionValidator.test.ts`

---

## Live Production Gates

These items stay unchecked in the launch checklist until verified against:

```text
https://home-finance-os.pages.dev
```

* Cloudflare Pages production deployment is green.
* Settings Auth Diagnostics reports the expected deployed build commit and
  branch for the current `main` checkpoint.
* `NODE_VERSION=22.13.0` is configured in Cloudflare Pages.
* Production Supabase auth environment variables are present in Cloudflare
  Pages.
* Admin magic-link sign-in, sign-out, session refresh, and expired-session
  recovery pass on the deployed site.
* Admin household claim/create, household metadata persistence,
  account/transaction snapshot persistence, settlement persistence, browser
  refresh restore, and realtime active-session sync pass on the deployed site.
* Expense, utility provider bill, and settlement saves with attached files pass
  on the deployed site.
* Metadata-only attachments remain visible after refresh without broken preview
  actions.
* Limited member settlement-entry flow passes on the deployed site.
* Utilities and savings routes smoke-pass on the deployed site; full utility
  and savings cloud persistence remains outside the one-month public beta scope
  unless the launch scope is explicitly expanded.
* Route smoke checks pass by opening and refreshing every public beta smoke
  route on the deployed site.
* Optional Google Drive upload/list/download checks pass when
  `VITE_GOOGLE_CLIENT_ID` is configured for the deployed build.

---

## Current Local Verification Command

Run before any production smoke pass:

```text
cd frontend
npm.cmd test
npm.cmd run build
```

---

## Sprint 104 Supabase Cutover

Before the live smoke pass, apply the schema and run the verification queries
from:

```text
docs/qa/Sprint-104-Supabase-Cutover.md
```

---

## Sprint 104 Member Transparency

Use this guide for the limited member and viewer production smoke pass:

```text
docs/qa/Sprint-104-Member-Transparency-Smoke.md
```

---

## Sprint 104 Route Smoke

Use this guide for the signed-out, admin, member, and viewer route pass:

```text
docs/qa/Sprint-104-Route-Smoke.md
```

---

## Sprint 104 Realtime Smoke

Use this guide for the two-tab active-session realtime pass:

```text
docs/qa/Sprint-104-Realtime-Smoke.md
```

---

## Sprint 104 Attachment Smoke

Use this guide for attachment persistence, preview, and member review:

```text
docs/qa/Sprint-104-Attachment-Smoke.md
```

---

## Sprint 104 Production Evidence Log

Record the live smoke result here before checking launch gates:

```text
Date: 2026-08-06
Tester: Product owner
Browser: Production browser session
Production URL: https://home-finance-os.pages.dev
Expected build commit: 288331a or newer
Settings Auth Diagnostics build: Passed
Settings Auth Diagnostics branch: main
Cloudflare deployment status: Passed for deployed app access
NODE_VERSION observed/configured: Pending explicit Cloudflare settings check
Supabase schema SQL applied: Passed
PostgREST schema cache reloaded: Passed
Admin auth result: Passed
Signed-out route blocking: Passed
Session refresh result: Passed
Expired-session recovery result: Passed
Household persistence result: Passed for linked refresh scenario
Account/transaction/allocation snapshot result: Passed
Settlement persistence result: Passed
July-to-August partial settlement result: Passed
July unsettled remainder after August payment: Passed
Settlement history after refresh: Passed
Failed-save form state result: Passed after no-save-regression retest
Expense attachment save result: Pending attachment smoke pass
Utility provider bill attachment save result: Pending attachment smoke pass
Settlement attachment save result: Pending attachment smoke pass
Metadata-only attachment preview result: Pending attachment smoke pass
Browser refresh restore result: Passed for linked household core and settlement records
Realtime active-session result: Pending realtime smoke pass
Limited member settlement-entry result: Pending retest on build 288331a or newer
Limited member personal account visibility: Passed after member save/refresh
  retest
Route smoke result: Pending full route smoke pass
Google Drive result, if configured: Pending optional check
Blockers: None for Supabase allocation cutover and partial settlement carryover
Decision: Continue Sprint 104 live validation
```

```text
Date:
Tester:
Browser:
Production URL: https://home-finance-os.pages.dev
Expected build commit:
Settings Auth Diagnostics build:
Settings Auth Diagnostics branch:
Cloudflare deployment status:
NODE_VERSION observed/configured:
Supabase schema SQL applied:
PostgREST schema cache reloaded:
Admin auth result:
Signed-out route blocking:
Session refresh result:
Expired-session recovery result:
Household persistence result:
Account/transaction/allocation snapshot result:
Settlement persistence result:
July-to-August partial settlement result:
July unsettled remainder after August payment:
Settlement history after refresh:
Failed-save form state result:
Expense attachment save result:
Utility provider bill attachment save result:
Settlement attachment save result:
Metadata-only attachment preview result:
Browser refresh restore result:
Realtime active-session result:
Limited member settlement-entry result:
Limited member personal account visibility:
Route smoke result:
Google Drive result, if configured:
Blockers:
Decision:
```
