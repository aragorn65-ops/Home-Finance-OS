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
* Member route access remains settlement-only across the public beta smoke
  route manifest:
  `frontend/test/publicBetaSmokeRoutes.test.ts`
* Single-household authenticated-link conflicts are blocked before local link
  state can be overwritten:
  `frontend/test/householdStorage.test.ts`
* Settlement role authorization:
  `frontend/test/authorization.test.ts` and
  `frontend/test/remoteSettlementPersistence.test.ts`
* Admin review/edit/delete of member-submitted settlement records:
  `frontend/test/remoteSettlementPersistence.test.ts`
* Household metadata cloud persistence contract:
  `frontend/test/remoteHouseholdPreferencesPersistence.test.ts`
* Account and transaction cloud snapshot contract:
  `frontend/test/remoteCoreSnapshotPersistence.test.ts` and
  `frontend/test/coreSnapshotSync.test.ts`
* Public beta cloud persistence scope is limited to household metadata,
  account/transaction core snapshots, and settlement records:
  `docs/sprint/Sprint-102.md` and
  `docs/qa/Public-Beta-Launch-Checklist.md`
* Cloud core snapshot write failures surface instead of being reported as saved:
  `frontend/test/coreSnapshotSync.test.ts`
* Supabase RPC wiring and realtime subscription contracts:
  `frontend/test/supabaseAuthBackendAdapter.test.ts`
* Production auth readiness diagnostics:
  `frontend/test/createAuthDiagnostics.test.ts`

---

## Live Production Gates

These items stay unchecked in the launch checklist until verified against:

```text
https://home-finance-os.pages.dev
```

* Cloudflare Pages production deployment is green.
* `NODE_VERSION=22.13.0` is configured in Cloudflare Pages.
* Production Supabase auth environment variables are present in Cloudflare
  Pages.
* Admin magic-link sign-in, sign-out, session refresh, and expired-session
  recovery pass on the deployed site.
* Admin household claim/create, household metadata persistence,
  account/transaction snapshot persistence, settlement persistence, browser
  refresh restore, and realtime active-session sync pass on the deployed site.
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
