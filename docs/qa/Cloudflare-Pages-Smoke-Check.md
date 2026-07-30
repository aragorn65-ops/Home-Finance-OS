# Cloudflare Pages Smoke Check

## Deployed URL

https://home-finance-os.pages.dev

---

## Purpose

Use this checklist after Cloudflare Pages deployments to confirm the public beta
app shell, client-side routing, authenticated admin access, cloud-backed
household persistence, limited member settlement-entry access, real-time
synchronization, and backup workflow are usable on the deployed site.

Use sample or low-risk data only.

Also rerun this checklist after switching the Cloudflare Pages production branch
back to `main`.

---

## Route Checks

Open and refresh each route. These are the first-class sidebar routes plus the
startup route:

```text
/
/app
/app/household-members
/app/accounts
/app/analytics
/app/transactions
/app/utilities
/app/settlements
/app/savings
/app/help-center
/app/settings
```

The route list is mirrored in
`frontend/src/app/router/publicBetaSmokeRoutes.ts` and covered by
`frontend/test/publicBetaSmokeRoutes.test.ts` so local route-smoke scope stays
aligned with the app sidebar before a production deployment check.

Expected result: each route loads without a Cloudflare 404, browser console
chunk-load error, or blank app shell.

---

## Deployed Build Check

1. Open `/app/settings`.
2. Open Auth Diagnostics.
3. Confirm the Build value matches the intended short commit from `main`.
4. Confirm the Branch value is `main`.

Expected result: the production site is running the intended checkpoint before
the rest of the smoke pass starts.

---

## Backup And Restore Check

1. Create or restore a small test household.
2. Add at least one account, one transaction, and one shared expense.
3. Open Settings.
4. Export a local backup.
5. Import the downloaded `.hfos-backup.json` file.
6. Confirm the restore preview appears.
7. Restore the backup.
8. Confirm Dashboard, Transactions, Settlements, and Analytics data return.

Expected result: backup import and restore complete without failure, and the
member expense contribution summary appears again in Analytics.

---

## Authenticated Cloud Persistence Check

1. Sign in with the invited admin account.
2. Create or claim one test household.
3. Add at least one account, one transaction, and one settlement.
4. Refresh the browser.
5. Confirm the household metadata, account, transaction, and settlement records
   reload from the cloud-backed store.
6. Sign out.
7. Confirm signed-out access cannot read or mutate cloud-backed household data.

Expected result: authenticated admin household metadata, account/transaction
snapshots, and settlement records survive refresh; signed-out access is blocked;
and failed cloud writes are visible instead of silently succeeding.

---

## Attachment Save Check

1. Sign in with the invited admin account.
2. Add an expense transaction with a small JPG, PNG, WebP, or PDF receipt.
3. Add an unpaid utility provider bill with a bill or receipt file attached.
4. Add a settlement record with a transfer receipt attached.
5. Refresh the browser.
6. Confirm all three records remain visible.
7. Confirm attachments remain listed by filename. If the deployed record has
   metadata only, confirm the UI shows preview-unavailable beta copy instead of
   a blank preview or broken Open button.

Expected result: attached-file saves do not block record persistence, and
metadata-only attachments remain understandable after refresh.

---

## Member Settlement Access Check

1. Sign in with a limited member account.
2. Add a settlement record where the member is the payer or receiver.
3. Confirm the settlement persists to the cloud-backed store.
4. Confirm the member cannot access account, transaction, utility, savings,
   settings, backup, household configuration, or migration write paths.
5. Sign in as admin and review, edit, then delete the member-submitted
   settlement.

Expected result: limited member access can submit settlement records only, and
admin retains control over settlement review and correction.

---

## Real-Time Synchronization Check

1. Sign in with the invited admin account.
2. Open the deployed app in a second browser tab for the same admin session.
3. Change household metadata, an account/transaction snapshot, or a settlement
   record in one tab.
4. Confirm the other active tab reflects the cloud-backed change without manual
   refresh.

Expected result: real-time updates reach the active admin browser session for
the public beta cloud-backed baseline. Multi-device household collaboration and
conflict resolution are not part of this smoke check.

---

## Google Drive Backup Status

Google Drive backup is optional and configuration-dependent. If
`VITE_GOOGLE_CLIENT_ID` is not configured for the Cloudflare Pages build,
Settings will keep Save to Google Drive and Restore from Google Drive disabled.

When `VITE_GOOGLE_CLIENT_ID` is configured, confirm the Google OAuth client
allows `https://home-finance-os.pages.dev`, redeploy Cloudflare Pages, then
verify Save to Google Drive and Restore from Google Drive are enabled in
Settings.

For the deployed public beta, local Export Backup and Import Backup remain the
required manual backup smoke-check path.

---

## Supabase Cloud Status

Public beta requires production auth configuration, cloud-backed household
persistence, limited member settlement-entry access, and real-time
synchronization on the Cloudflare Pages deployment.

Before running the production auth and cloud smoke checks, apply the latest
`docs/architecture/supabase-spike-schema.sql` in the Supabase SQL editor. Then
reload the PostgREST schema cache:

```sql
notify pgrst, 'reload schema';
```

If the deployed app reports that `public.load_household_preferences` or another
RPC cannot be found in the schema cache, rerun the schema SQL, run the cache
reload statement above, wait a few seconds, then refresh the deployed app.

For the one-month public beta scope, cloud persistence means household metadata,
account/transaction core snapshots, and settlement records. Utilities and
savings routes still smoke-pass, but full utility and savings cloud persistence
is not a launch blocker unless scope is explicitly expanded.

Do not expose multi-device household access, shared collaboration, or conflict
resolution as supported public beta behavior.

---

## Sprint 39 Result

**Date:** 2026-07-22

**Result:** Passed

Backup import and restore completed successfully on the deployed Cloudflare
Pages site. Dashboard, Transactions, Settlements, and Analytics were confirmed
after restore.
