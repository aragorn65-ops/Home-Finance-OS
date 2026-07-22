# Cloudflare Pages Smoke Check

## Deployed URL

https://home-finance-os.pages.dev

---

## Purpose

Use this checklist after Cloudflare Pages deployments to confirm the local-first
beta app shell, client-side routing, and browser-storage backup workflow are
usable on the deployed site.

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

Expected result: each route loads without a Cloudflare 404, browser console
chunk-load error, or blank app shell.

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

## Google Drive Backup Status

Google Drive backup is optional and configuration-dependent. If
`VITE_GOOGLE_CLIENT_ID` is not configured for the Cloudflare Pages build,
Settings will keep Save to Google Drive and Restore from Google Drive disabled.

When `VITE_GOOGLE_CLIENT_ID` is configured, confirm the Google OAuth client
allows `https://home-finance-os.pages.dev`, redeploy Cloudflare Pages, then
verify Save to Google Drive and Restore from Google Drive are enabled in
Settings.

For the deployed local-first beta, local Export Backup and Import Backup remain
the required smoke-check path.

---

## Supabase Spike Status

Supabase auth/cloud validation is disposable-project-only. Do not enable
Supabase production credentials on the Cloudflare Pages beta until the
architecture decision criteria and disposable-project validation notes pass.

The deployed local-first smoke check does not require Supabase auth, remote
migration, sync, or production cloud storage.

---

## Sprint 39 Result

**Date:** 2026-07-22

**Result:** Passed

Backup import and restore completed successfully on the deployed Cloudflare
Pages site. Dashboard, Transactions, Settlements, and Analytics were confirmed
after restore.
