# HFOS Supabase Spike Validation Notes

## Purpose

Use these notes only with a disposable Supabase project. Do not connect real
beta household data, production credentials, or the Cloudflare Pages production
environment while validating the spike.

---

## Disposable Project Setup

1. Create a new Supabase project for Sprint 41 validation only.
2. Run `docs/architecture/supabase-spike-schema.sql` in the Supabase SQL editor.
   Re-run it after Sprint 52 so the disposable project has the
   `claim_household_from_backup` RPC.
3. Enable an auth method that is acceptable for the spike, such as email magic
   link.
4. Copy only the disposable project URL and anon key into local Vite env values:

```text
VITE_HFOS_AUTH_ENABLED=true
VITE_HFOS_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=<disposable-project-url>
VITE_SUPABASE_ANON_KEY=<disposable-project-anon-key>
```

5. Start the app locally from `frontend` and keep the deployed Cloudflare beta
   unchanged.

---

## Validation Path

1. Confirm the app remains local-first when `VITE_HFOS_AUTH_ENABLED=false`.
2. Confirm `VITE_HFOS_AUTH_PROVIDER=supabase` selects the Supabase adapter
   skeleton and does not create remote records before live wiring exists.
3. After a real Supabase client is intentionally added, sign in as test user A.
4. Create a household claim draft from disposable local test data.
5. Confirm the owner membership links test user A to the household owner member.
6. Sign in as unrelated test user B and confirm user B cannot read user A's
   household-scoped records.
7. Add a private account owned by user A's linked member and confirm only user A
   can read it.
8. Move a migration draft through uploaded, validated, committed, and aborted
   states using disposable records only.

---

## Pass Conditions

* RLS prevents unaffiliated household reads.
* Private member records are hidden from other household users.
* Normal app flows do not require a service-role key in the browser.
* Migration validation can fail closed without deleting local browser data.
* Cloudflare Pages hosting remains compatible with the auth/session flow.

---

## Stop Conditions

Stop and reassess before production work if any normal user path requires
browser access to a service-role key, broad RLS bypass, unsafe local-data
deletion, or moving the frontend away from Cloudflare Pages.
