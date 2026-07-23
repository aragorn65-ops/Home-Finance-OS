# Sprint 86

## Production Auth Baseline

**Branch:** main

---

## Intent

Sprint 86 starts the cautious 10-sprint path toward app syncing across devices.
The goal is to make production authentication readiness visible and testable
before any remote CRUD, migration import, or automatic sync behavior is enabled.

This sprint keeps HFOS local-first. Browser storage remains the runtime source
of truth, and testers still need manual backups.

---

## Planned Scope

* [x] Add a production-auth baseline checklist to auth diagnostics.
* [x] Check Supabase provider selection, required env vars, session status,
      household membership, remote diagnostic warnings, and the sync boundary.
* [x] Keep remote CRUD and automatic multi-device sync explicitly disabled.
* [x] Update the environment template for the Supabase production-auth
      baseline.
* [x] Add focused readiness-check tests.

---

## Out Of Scope

* Remote CRUD or automatic sync.
* Production data migration.
* Supabase table/schema changes.
* Realtime updates.
* Conflict handling.
* Shared household collaboration.

---

## Production Auth Baseline Checklist

1. Cloudflare Pages build uses `VITE_HFOS_AUTH_ENABLED=true`.
2. Cloudflare Pages build uses `VITE_HFOS_AUTH_PROVIDER=supabase`.
3. Cloudflare Pages has `VITE_SUPABASE_URL` configured.
4. Cloudflare Pages has `VITE_SUPABASE_ANON_KEY` configured.
5. Supabase auth redirects include the production Pages URL.
6. Magic-link sign-in works from the production URL.
7. Auth diagnostics show a signed-in session.
8. Auth diagnostics show at least one household membership after claim or
   invite.
9. Auth diagnostics complete without remote read warnings.
10. The app still states that remote CRUD and automatic multi-device sync are
    disabled.

---

## Verification Targets

* `npm test`
* `npm run build`
* Manual production Settings auth-diagnostics check after Cloudflare env vars
  are configured.

---

## Notes For Sprint 87

Sprint 87 should add the cloud data schema only after Sprint 86 auth diagnostics
can prove the production build is using the intended Supabase project and auth
callback flow.
