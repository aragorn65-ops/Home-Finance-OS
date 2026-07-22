# Public Beta Launch Checklist

## Purpose

Use this checklist before inviting public beta testers to the Cloudflare Pages
deployment.

Public beta remains local-first. Testers must use sample or low-risk data, keep
their own backups, and understand that HFOS has no production account recovery
or production cloud sync.

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
* [ ] `NODE_VERSION=22.13.0` is configured in Cloudflare Pages.
* [ ] Route smoke checks pass for `/`, `/app`, `/app/household-members`,
  `/app/accounts`, `/app/transactions`, `/app/utilities`, `/app/settlements`,
  `/app/savings`, `/app/analytics`, `/app/help-center`, and `/app/settings`.
* [ ] App banner says to use low-risk data and explains there is no account
  recovery or production sync.
* [ ] Settings Data & Backup safety note repeats the public beta safety
  warning.
* [ ] Local Export Backup creates a valid `.hfos-backup.json` file.
* [ ] Local Import Backup validates the file, shows a restore preview, and
  restores Dashboard, Transactions, Settlements, and Analytics data.
* [ ] Clear Test Data keeps household setup and removes financial test records.
* [ ] Reset All Application Data returns the app to first-time setup.
* [ ] Google Drive backup status in Settings is understood:
  `VITE_GOOGLE_CLIENT_ID` configured means Drive actions are enabled after
  Google permission; missing config means Drive actions stay disabled and local
  backup remains the required path.

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
* Export a backup before and after meaningful testing.
* Keep backup passwords outside HFOS; forgotten backup passwords cannot be
  recovered.
* App lock protects only this browser session; it is not account login.
* Google Drive backup is optional and configuration-dependent.
* Report the page, selected month, browser, theme, expected behavior, actual
  behavior, and screenshots when possible.
