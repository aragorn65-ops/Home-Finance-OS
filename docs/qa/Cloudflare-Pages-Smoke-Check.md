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

Open and refresh each route:

```text
/
/app
/app/analytics
/app/transactions
/app/settlements
```

Expected result: each route loads without a Cloudflare 404.

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

## Sprint 39 Result

**Date:** 2026-07-22

**Result:** Passed

Backup import and restore completed successfully on the deployed Cloudflare
Pages site. Dashboard, Transactions, Settlements, and Analytics were confirmed
after restore.
