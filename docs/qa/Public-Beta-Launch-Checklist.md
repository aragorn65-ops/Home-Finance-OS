# Public Beta Launch Checklist

## Purpose

Use this checklist before inviting public beta testers to the Cloudflare Pages
deployment.

Public beta requires authenticated admin access, limited member settlement-entry
access, cloud-backed household persistence, and real-time synchronization.
Testers must use sample or low-risk data and keep their own backups.
Multi-device household access and conflict resolution remain out of scope.

Repo-side evidence for completed gates is tracked in
`docs/qa/Public-Beta-Launch-Evidence.md`. Unchecked gates require live
production validation on the current Cloudflare Pages deployment.

---

## Launch Decision

Do not launch public beta unless every required item below is checked on the
current production deployment:

```text
https://home-finance-os.pages.dev
```

---

## Required Gates

* [ ] Cloudflare Pages production deployment is green.
* [ ] Settings Auth Diagnostics shows the expected deployed build commit and
  branch for the current `main` checkpoint.
* [ ] `NODE_VERSION=22.13.0` is configured in Cloudflare Pages.
* [ ] Production auth environment is configured for the deployed beta:
  `VITE_HFOS_AUTH_ENABLED=true`, `VITE_HFOS_AUTH_PROVIDER=supabase`,
  `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
* [ ] Latest Supabase schema SQL has been applied and the PostgREST schema
  cache has been reloaded.
* [ ] Admin sign-in, sign-out, session refresh, and expired-session recovery
  pass on the production deployment.
* [ ] Limited member sign-in works for settlement entry only.
* [ ] Signed-out users cannot access or mutate cloud-backed household data.
* [ ] A signed-in admin can create or claim one household and persist household
  metadata to the cloud source of truth.
* [ ] A signed-in member can add a settlement record only when they are the
  paying or receiving member.
* [ ] A signed-in member cannot create, edit, or delete accounts, transactions,
  utilities, savings, settings, backups, household configuration, or migration
  state.
* [ ] A signed-in admin can review, edit, and delete member-submitted settlement
  records.
* [ ] Household metadata, account/transaction core snapshots, and settlement
  records persist to the cloud-backed household store.
* [ ] Expense, utility provider bill, and settlement records save successfully
  when a receipt or bill file is attached.
* [ ] Metadata-only attachments remain visible after refresh without exposing a
  broken preview action.
* [ ] Refreshing the browser reloads household data from the cloud store without
  relying on localStorage as the primary source.
* [ ] Real-time synchronization propagates cloud-backed changes into the active
  signed-in browser session without manual refresh.
* [ ] Cloud write failures are visible, fail closed, and do not silently report
  saved data.
* [ ] Admin access is single-household and member access is settlement-entry
  only for public beta; broad invite, shared membership, and multi-device
  collaboration flows are not exposed as supported beta behavior.
* [ ] Conflict resolution is not promised; unsupported concurrent edit states
  are blocked, serialized, or clearly reported.
* [ ] Route smoke checks pass for `/`, `/app`, `/app/household-members`,
  `/app/accounts`, `/app/transactions`, `/app/utilities`, `/app/settlements`,
  `/app/savings`, `/app/analytics`, `/app/help-center`, and `/app/settings`.
* [x] App banner says to use low-risk data, sign in as the household admin, and
  keep backups during public beta.
* [x] Settings Data & Backup safety note repeats the public beta cloud and
  backup warning.
* [x] Local Export Backup creates a valid `.hfos-backup.json` file.
* [x] Local Import Backup validates the file, shows a restore preview, and
  restores Dashboard, Transactions, Settlements, and Analytics data.
* [x] Clear Test Data keeps household setup and removes financial test records.
* [x] Reset All Application Data returns the app to first-time setup.
* [x] Google Drive backup status in Settings is understood:
  `VITE_GOOGLE_CLIENT_ID` configured means Drive actions are enabled after
  Google permission; missing config means Drive actions stay disabled and local
  backup remains the required manual backup path.

---

## Public Beta Scope Boundary

For the one-month public beta target, cloud-backed persistence is required for
household metadata, account/transaction core snapshots, and settlement records.
Utilities and savings routes remain part of the smoke pass, but full cloud
persistence for utility provider bills, savings goals, and savings activities
is not a public beta launch blocker unless the scope is explicitly expanded.
Local export/import backup remains the required safety rail for those local
modules.

---

## Optional Google Drive Gate

Run this only when Cloudflare Pages has `VITE_GOOGLE_CLIENT_ID` configured:

* [ ] Google OAuth client allows `https://home-finance-os.pages.dev`.
* [ ] Cloudflare Pages was redeployed after changing `VITE_GOOGLE_CLIENT_ID`.
* [ ] Save to Google Drive uploads a validated backup.
* [ ] Restore from Google Drive lists app-created backups.
* [ ] Selecting a Drive backup validates it and shows the same restore preview
  as local import.

---

## Launch Notes To Give Testers

* Use sample or low-risk data only.
* Sign in with the invited admin account before testing cloud-backed household
  workflows.
* Members may sign in only to add settlement records where they are the payer or
  receiver.
* Export a backup before and after meaningful testing.
* Keep backup passwords outside HFOS; forgotten backup passwords cannot be
  recovered.
* Public beta supports authenticated admin access, limited member settlement
  entry, cloud-backed household metadata, account/transaction snapshots,
  settlement persistence, and real-time sync for the active household.
* Multi-device household access, broad shared collaboration, and conflict
  resolution are not part of public beta.
* App lock protects only this browser session; it is separate from account
  login.
* Google Drive backup is optional and configuration-dependent.
* Report the page, selected month, browser, theme, expected behavior, actual
  behavior, and screenshots when possible.
