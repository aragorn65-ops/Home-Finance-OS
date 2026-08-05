# Sprint 104 Admin Auth Smoke

## Purpose

Use this after the Supabase cutover and Auth Diagnostics pass on production.

This smoke check verifies the invited admin account can enter and leave the
deployed app cleanly, survives browser refresh while signed in, and fails closed
when the session is no longer valid.

---

## Target

```text
https://home-finance-os.pages.dev
```

Expected deployed build: latest `main` commit for the Sprint 104 pass.

---

## Steps

1. Open `/app/settings` in a clean browser session.
2. Confirm signed-out access is blocked from app data routes and that Auth
   Diagnostics remains reachable.
3. Request a magic link for the invited admin account.
4. Complete sign-in from the email link.
5. Confirm the app lands on an admin-allowed route.
6. Open Settings and confirm Auth Diagnostics shows:
   * auth enabled
   * Supabase provider
   * active signed-in session
   * `main` branch
   * expected deployed build commit
7. Refresh the browser.
8. Confirm the signed-in admin session remains active.
9. Sign out.
10. Confirm app data routes are blocked again.
11. To test expired-session recovery, clear or expire the browser Supabase
    session, refresh, and confirm cloud-backed app data is blocked until a new
    sign-in succeeds.

---

## Pass Criteria

* Admin magic-link sign-in succeeds on production.
* Browser refresh preserves the valid admin session.
* Sign-out removes access to cloud-backed app data.
* Expired or missing sessions fail closed.
* Any auth failure is visible and does not silently allow data access.

---

## Evidence Fields

Record the result in `docs/qa/Public-Beta-Launch-Evidence.md`:

```text
Admin auth result:
Signed-out route blocking:
Session refresh result:
Expired-session recovery result:
Blockers:
```
