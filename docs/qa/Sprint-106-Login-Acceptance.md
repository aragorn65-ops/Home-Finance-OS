# Sprint 106 Login Acceptance

## Implemented Locally (2026-10-20)

- `/login`: email/password, visibility toggle, password reset request, explicit
  email-link fallback, pending/error/success states, duplicate-submit protection.
- `/reset-password`: dedicated recovery callback. Requires a recovery event
  associated with a verified Auth user; explicit error callbacks cannot use an
  unrelated existing session. Password confirmation is required.
- `/account/password`: signed-in members can set/change their own password.
  Available through Settings > Account Security.
- Header sign-in and protected-page sign-in actions open `/login`.
- A pending recovery session is routed to the password screen before financial
  views mount. An identity-only sessionStorage marker retains this state across
  refresh; it is not authorization and is checked against Auth. Passwords are
  never written to application storage. Failed password updates retain the gate.
- Adapter creation is shared across concurrent requests; auth observers defer
  callbacks outside the SDK lock.
- Existing identities, household records, allocations, settlements, and receipt
  storage were not migrated, reset, or restored. Private-storage isolation remains
  disabled. Invitations were not changed in this slice.

## Automated Evidence

- Backend suite: 317 passed, 1 optional backup-file test skipped, 0 failures.
- Component suite (`npm.cmd run test:ui`): 19 passed using jsdom and mocked Auth.
  Includes successful/failed sign-in, recovery failures, explicit magic links,
  duplicate submissions, password confirmation, expired callbacks, recovery
  gating before protected content mounts, and session-hook failure reporting.
- Production build passes.
- Lint has 0 errors and 12 existing hook warnings. Four previously reported
  unused declarations were removed without changing migration/settlement behavior.
- Chromium suite (`npm.cmd run test:e2e`): 8 passed, using an isolated fake
  Supabase endpoint with the real Auth SDK. Includes desktop/mobile light/dark
  screenshots, keyboard navigation, wrong password, same-browser identity
  switching and refresh, and recovery callback/refresh/password confirmation.
  This does not verify live financial balances or live email delivery.
- Same-role identity changes reload membership and core data. Initial financial
  rendering waits for settlement applications as well as core records. Stale
  settlement and preference responses are discarded after unmount.
- Compatible dependency updates resolved the reported advisories without a
  forced major upgrade. npm audit now reports 0 vulnerabilities.

## Preview

Local URL: `http://127.0.0.1:5173/login`.
Cloud authentication is disabled in the current local configuration, so the
screen can be inspected without sending credentials or modifying live accounts.
No production deployment was performed.

## Configuration Before Live Testing

Use a disposable Supabase test project and isolated browser profile first.
Never restore a backup into production as part of these tests.

1. Set `VITE_HFOS_AUTH_ENABLED=true`, `VITE_HFOS_AUTH_PROVIDER=supabase`,
   `VITE_SUPABASE_URL`, and the project's publishable/anon key in the test build.
   Never use a service-role key in a Vite environment variable.
2. Confirm Email authentication/password sign-in is enabled. Preserve current
   signup restrictions and server-enforced household membership rules.
3. Allowlist the exact `/login` and `/reset-password` URLs for each approved
   deployment origin. For local tests these are
   `http://127.0.0.1:5173/login` and `http://127.0.0.1:5173/reset-password`.
   Production equivalents must be reviewed before deployment:
   `https://home-finance-os.pages.dev/login` and
   `https://home-finance-os.pages.dev/reset-password`.
4. Review recovery email templates, delivery, password policy, rate limiting,
   and any secure password-change reauthentication requirements.
5. Existing magic-link users should set a password while signed in or complete
   the recovery flow. Do not sign them up again. The user enters their own
   password; it must not be pasted into logs, support messages, or test evidence.

## Remaining Acceptance Gates

- [x] Desktop/mobile, light/dark, and keyboard navigation in isolated Chromium.
- [ ] Real password-manager behavior.
- [ ] Existing user setup, sign out, password login, refresh, wrong password.
- [ ] Recovery email, expired/reused link, refresh before completion, failed update.
- [ ] Session expiration or account switch while the password screen is open.
- [ ] Admin -> Rasha -> Lyn -> Admin on the same browser with no previous-user
  private records visible, and unchanged IDs, roles, balances, payment links,
  authorized receipts, and backup contents.
- [ ] Server authorization checks, invitation onboarding and dependency review.
- [ ] Production configuration approval and user acceptance before deployment.

## Deployment Blockers

The user approved Cloudflare OAuth renewal with account:read, user:read, and
pages:write on 2026-10-20. Browser device authorization completed successfully.
The user confirmed no separate Supabase test project exists. Automated tests
remain isolated. Live Supabase password/email redirect configuration and recovery
delivery remain unverified. No production deployment or financial data mutation
has occurred.

### Controlled Live Acceptance

Use an approved preview origin with the existing Supabase project only after
confirming its exact callback allowlist. Keep magic-link fallback available.
The user performs password entry and email verification, never the agent.
Do not create duplicate accounts, import backups, or alter finance records.
Verify the existing user's identity and role, set a password while signed in,
then sign out and sign in with that password. Verify refresh and recovery.
Compare financial records, payment applications and authorized receipts before
and after same-browser account switching. Production promotion remains gated
on these results; synthetic identity tests do not replace financial acceptance.

## Preview Deployment (2026-10-20)

- Commit: `805fd3a`.
- Branch alias: `https://login-preview.home-finance-os.pages.dev`.
- Immutable deployment: `https://b0265b87.home-finance-os.pages.dev`.
- Built with the existing production public client configuration; no service-role
  credentials or database migrations. Production deployment was not replaced.
- Deployed Chromium checks: `/login`, `/reset-password`, `/app/transactions`,
  `/app/settlements` returned HTTP 200 with no page errors. Signed-out finance
  routes showed Sign In Required. Login screenshot inspected.
- Public Auth settings report email enabled, confirmation required, anonymous
  sign-in disabled. Signup is currently enabled; this existing setting was not
  changed. Household membership must remain server-authorized.
- Redirect allowlist requires user dashboard verification. Add exact preview
  alias `/login` and `/reset-password` URLs without replacing existing entries.
  Verify production equivalents before production promotion.
- No live account password was entered or changed by the agent.

## Fresh Owner Preview Regression

User acceptance found an empty household on the fresh preview origin after
successful owner login. Bootstrap was restricted to member/viewer roles, while
owner/admin routes could mount without a local household. Extended bootstrap to
all active household roles, gated missing/sparse household pages until loading
completes, and surfaced load failures. Added cancellation checking after member
fetch. Removed financial collection clearing from linked-shell saves so repairs
preserve cached records pending authoritative cloud hydration.

Verification: 318 node tests passed (1 optional backup test skipped), 19 component
tests passed, 12 Chromium tests passed, build passed, lint 0 errors/12 existing
warnings. New Chromium cases cover fresh owner/admin login, existing member and
transaction hydration, and refresh with no server mutation requests. A storage
test verifies shell creation and replacement preserve financial collections.
Live household counts, balances, applications, and receipts still require user
acceptance. Production promotion remains on hold.

## Multiple Membership Selection

The user's current-build screenshot showed eight memberships and a local link to
`2ec4413e-9ddb-46d3-996d-4a80d86cb33c`, differing from the earlier production
household `bafb3901-1666-4d6f-9471-153efbcf7cff`. Removed arbitrary first/newest
membership selection when multiple households exist. Preserve an explicitly linked
authorized household; otherwise require selection. Settings > Account now permits
selection from active memberships with names, roles, and full IDs.

Selection rechecks the authenticated user and active server membership, loads
profiles, saves the browser link without clearing financial collections, then
reloads into gated cloud hydration. It does not write server finance records.
21 component tests and 13 Chromium tests pass, including multiple-household
selection, refresh, and mobile layout. Live data presence is not yet verified.
