# Sprint 104 Route Smoke

Use this guide after Cloudflare Pages deploys the latest `main` checkpoint.

```text
https://home-finance-os.pages.dev
```

Use sample or low-risk data only.

---

## Purpose

Confirm every first-class public beta route opens directly and survives browser
refresh under the expected access state. This catches Cloudflare fallback,
client-side router, lazy chunk, auth gate, and blank-shell issues before public
beta testers are invited.

---

## Build Gate

1. Open `/app/settings`.
2. Open Auth Diagnostics.
3. Confirm Build is `3a7b065` or newer.
4. Confirm Branch is `main`.

Expected result: the production site is running the intended Sprint 104 route
smoke checkpoint.

---

## Signed-Out Routes

Sign out, then open and refresh each route.

| Route | Expected Result |
| --- | --- |
| `/` | Loads startup/auth-safe shell. |
| `/app` | Blocked by sign-in gate. |
| `/app/household-members` | Blocked by sign-in gate. |
| `/app/accounts` | Blocked by sign-in gate. |
| `/app/transactions` | Blocked by sign-in gate. |
| `/app/utilities` | Blocked by sign-in gate. |
| `/app/settlements` | Blocked by sign-in gate. |
| `/app/savings` | Blocked by sign-in gate. |
| `/app/analytics` | Blocked by sign-in gate. |
| `/app/help-center` | Blocked by sign-in gate. |
| `/app/settings` | Loads Settings for sign-in recovery and diagnostics. |

Expected result: no cloud-backed household data is visible while signed out.

---

## Admin Routes

Sign in as owner/admin, then open and refresh each route.

| Route | Expected Result |
| --- | --- |
| `/` | Loads app entry without a blank shell. |
| `/app` | Loads dashboard. |
| `/app/household-members` | Loads roster with admin management controls. |
| `/app/accounts` | Loads accounts with Add/Edit/Delete controls. |
| `/app/transactions` | Loads transactions with Add/Edit/Delete controls. |
| `/app/utilities` | Loads utilities with provider bill management controls. |
| `/app/settlements` | Loads settlements with Record/Edit/Delete controls. |
| `/app/savings` | Loads savings with goal and activity controls. |
| `/app/analytics` | Loads analytics. |
| `/app/help-center` | Loads help center. |
| `/app/settings` | Loads settings with admin cloud and backup controls. |

Expected result: every route loads and refreshes without a Cloudflare 404,
browser chunk-load error, or blank app shell.

---

## Member Routes

Sign in as a limited member, then open and refresh each route.

| Route | Expected Result |
| --- | --- |
| `/` | Loads app entry without a blank shell. |
| `/app` | Loads dashboard/transparency shell. |
| `/app/household-members` | Loads roster without management controls. |
| `/app/accounts` | Loads household accounts and the member's personal accounts without Add/Edit/Delete. |
| `/app/transactions` | Loads transactions without Add/Edit/Delete. |
| `/app/utilities` | Loads utilities without provider bill write controls. |
| `/app/settlements` | Loads settlements with Record Settlement, but without Edit/Delete. |
| `/app/savings` | Loads savings without goal/activity write controls. |
| `/app/analytics` | Loads analytics. |
| `/app/help-center` | Loads help center. |
| `/app/settings` | Loads display/app-lock settings and Auth Diagnostics only. |

Expected result: member routes are transparent but management controls stay
hidden, except involved-member settlement entry.

---

## Viewer Routes

If a viewer role is available, sign in as viewer, then open and refresh each
route.

| Route | Expected Result |
| --- | --- |
| `/` | Loads app entry without a blank shell. |
| `/app` | Loads dashboard/transparency shell. |
| `/app/household-members` | Loads roster without management controls. |
| `/app/accounts` | Loads visible accounts without Add/Edit/Delete. |
| `/app/transactions` | Loads transactions without Add/Edit/Delete. |
| `/app/utilities` | Loads utilities without provider bill write controls. |
| `/app/settlements` | Loads settlements without Record/Edit/Delete. |
| `/app/savings` | Loads savings without goal/activity write controls. |
| `/app/analytics` | Loads analytics. |
| `/app/help-center` | Loads help center. |
| `/app/settings` | Loads display/app-lock settings and Auth Diagnostics only. |

Expected result: viewer routes are review-only.

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
Signed-out route result:
Admin route result:
Member route result:
Viewer route result, if tested:
Cloudflare 404/chunk errors observed:
Blank shell observed:
Blockers:
Decision:
```
