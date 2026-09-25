# Public Beta Launch Evidence

Use this ledger beside `docs/qa/Public-Beta-Launch-Checklist.md`.

The checklist remains the launch decision source. This file records which gates
have repo-side evidence and which gates still require live Cloudflare Pages or
Supabase validation before inviting public beta testers.

---

## Sprint 104 Acceptance - 2026-09-25

The product owner explicitly requested sprint closure and progression to the
next sprint after reporting these final passes on the `e88b523` baseline:

* Utility attachment upload/save/refresh/view.
* Viewing that attachment in Rasha and Lyn sessions.
* Sign-in in an incognito browser, restore from Google Drive, and successful
  Transaction and Utility attachment previews afterward.

These confirmations supersede the corresponding pending live retests in the
historical notes below. Earlier financial, member UI access, and automatic-sync
passes remain recorded. Last code validation: 277 tests and production build
passed; no new test run is claimed for this documentation-only closeout.

Sprint 104 is closed as an accepted stabilization milestone. Remaining launch
evidence is tracked in `docs/sprint/Sprint-105.md`; unchecked launch gates are
not implicitly passed. No reset, data migration, or financial changes accompany
this transition.

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

### Verification Update - 2026-09-21

Recorded from the product owner's testing confirmations in this conversation.
These are user-reported production results, not an independent authenticated
browser audit. Latest code checkpoint: `86b372f`.

* Passed: July/August entry and September transactions remain consistent across
  participating member windows.
* Passed: partial and final settlements, prior-month outstanding carryover,
  and reduction of carried balances after payment.
* Passed: Dadi Buboy / Owner identity and dashboard dues matching Settlement
  balances after refresh in admin, Rasha, and Lyn sessions.
* Passed: backup export and import in a different browser, with matching data.
* The product owner reports settling the remaining PHP 0.02 deficit. The
  historical cause of that discrepancy is not established by these results.

Repo verification at `86b372f`: 265 tests passed and production build passed.
Regression tests reproduce and prevent out-of-order or canceled cloud restores
from replacing newer local balances. This is not proof that the same race
caused the historical PHP 0.02 incident.

Remaining release evidence: full direct-open/refresh route checks, role/privacy
checks (including viewer if supported), attachment preview/refresh checks,
active-session sync without manual refresh, and explicit Cloudflare environment
verification. Earlier guides describe historical checkpoints; validate current
permissions against the current implementation before using their expectations.

Decision: retain the verified finance baseline and continue the remaining
release checks. Do not reset test data or mark all launch gates complete.

### Earlier Cutover Evidence

### Follow-up - 2026-09-23

### Utility Backup Follow-up - 2026-09-25

Further persistence finding: Add Bill File / Remove called a local-only
replaceBillAttachments method. It now awaits the same cloud snapshot save used
by other utility actions and surfaces failure instead of reporting success.
Tests cover added content surviving cloud reload, removal persistence, pending
save completion, and cloud failure. All 277 tests and production build pass;
live upload/save/refresh retest is pending. Payment-form receipt selection is
still a draft until Mark Bill Paid is saved. No financial calculations changed.

The product owner confirmed previews in admin, Rasha, and Lyn for Transactions
and Utilities, then reported unavailable paid/unpaid utility previews after a
successful backup export and restore. Backup serialization retains file bodies;
the utility cloud writer still lacked the transaction metadata-only protection.
Extended matching-local-file preservation to provider bill and payment
attachments, sharing the existing identity check. Cloud replacements and
deletions remain authoritative. Added export/restore plus repeated metadata-only
refresh coverage for both bill states and payment receipts. All 275 tests and
production build passed. Live retest remains pending; the user's backup contents
have not been inspected, so missing original bytes cannot be assumed recoverable.

### Earlier September Verification

The product owner reports the no-refresh notes sync retest passed after
`58d1b65`, unsaved form fields remained intact during background sync, and
Rasha/Lyn passed the member UI access checks. These are UI checks, not an
independent backend authorization audit.

Attachment follow-up: retain file bodies for explicitly household-visible
transactions in core snapshots and retain bill/payment files when saving
utilities. Private, participant-only, and unspecified-visibility attachment
bodies remain excluded from shared snapshots. Migration payloads remain
metadata-only. No SQL change or financial recomputation is required.

Legacy metadata-only attachments cannot regenerate missing file bytes: reattach
the original to an existing record if needed. Do not recreate the transaction.
This uses the existing inline attachment storage, not a new object-storage
service; browser storage and snapshot payload capacity still limit file volume.
Production image/PDF preview in admin and member browsers remains pending.

Admin Transactions -> View follow-up: a metadata-only core restore could erase
an existing local receipt body, including on focus return from the preview tab.
The local writer now preserves bytes only for a matching attachment still
listed on the same transaction in the same household (id, name, MIME type,
size, creation time). Remote nonempty content and deletions stay authoritative.
Verification: 274 tests and production build passed. The reported live
open/close/reopen sequence remains pending; files already lost are not recovered
by this guard. No amount, allocation, or settlement calculation changes.

Follow-up testing: attachment listings persist, but preview is unavailable in
member browsers; cross-browser preview remains open. A notes-only transaction
edit did not appear in the member window until browser refresh, so the
active-session sync gate failed.

Repo follow-up adds a visible-page 30-second core snapshot refresh fallback,
focus/online recovery, non-blocking background refresh, and refreshed read-only
transaction details without resetting edit forms. Verification: 268 tests and
production build passed. Live no-refresh retest remains pending; the production
realtime notification delivery failure itself has not been independently
diagnosed. No finance formulas or database records were changed.

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
