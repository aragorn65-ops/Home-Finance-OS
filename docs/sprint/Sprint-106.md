# Sprint 106

## Email And Password Login

**Branch:** main
**Started:** 2026-10-20 (Asia/Manila)
**Status:** Active - login and password screens implemented; live acceptance/deployment pending
**Baseline:** `22fd49b`, with user-accepted receipt save/view and backup restore.

## Intent

Provide normal email/password sign-in without recreating existing Supabase users,
household members, roles, transactions, allocations, or settlements. Retain
magic links as a temporary fallback. An invitation grants household membership;
it is not a reusable login credential.

## Scope And Progress

- [x] Close Sprint 105 with explicit disposition of unfinished release gates.
- [x] Inspect current auth adapter, session hook, sign-in entry point, and invite flow.
- [x] Add and test password sign-in through the existing auth adapter boundary.
- [x] Implement password setup and recovery screens for existing accounts.
- [x] Provide a sign-in form with email/password, validation, loading,
  error, and recovery states; retain the magic-link fallback.
- [ ] Verify real email delivery, redirect allowlisting, expired/reused recovery
  links, browser refresh, and existing-account password setup in an isolated test environment.
- [ ] Integrate admin-controlled invitations with onboarding and existing member
  linking. If invitation codes are added, enforce expiry and single-use on the
  server, bind the intended household/role, and prevent privilege escalation.
- [ ] Verify session recovery and authorization before mounting protected views.
- [ ] Test Admin -> Rasha -> Lyn -> Admin switching in the same browser, with
  unchanged member IDs, roles, balances, allocation links, and authorized receipts.
- [ ] Record deployment/configuration requirements and obtain manual acceptance.

## Initial Findings

- At sprint start, `AuthBackendAdapter.ts` accepted email and redirect URL only
  for sign-in; the Supabase adapter exposed only `signInWithOtp`. Password
  sign-in/update/recovery methods have now been added below.
- `useAuthSession.ts` routes sign-in through the adapter; preserve this boundary
  and update disabled/in-memory adapters and their tests consistently.
- `AuthSessionButton.tsx` routes signed-out users to Settings sign-in. The
  everyday login experience must no longer depend on finding diagnostic controls.
- Existing member invitation uses OTP plus `invite_household_member`. Review
  server authorization and operation ordering before extending it; do not infer
  invite security from UI visibility.

## First Implementation Slice

Implement adapter-level password sign-in with focused success/failure tests,
then connect the login form. Add recovery and existing-account password setup
without changing authentication subject IDs. Keep this separate from the
previously reverted private-storage isolation patch.

### Adapter Verification (2026-10-20)

- Added an explicit password sign-in request alongside the unchanged default
  magic-link request. The Supabase adapter calls `signInWithPassword`, preserves
  password whitespace, trims the email, and maps the returned authenticated user
  directly rather than reading a potentially older cached session.
- Missing credentials, provider rejection, and absent sessions fail closed.
  Provider rejection details are not exposed in the password error message.
- Tests confirm the existing user ID is retained and password sign-in performs
  no OTP request or household query/mutation. No password UI is enabled yet.
- `npm.cmd test`: 308 passed, 1 optional backup-file test skipped, 0 failed.
- `npm.cmd run build`: passed.
- `npm.cmd run lint`: failed on four pre-existing unused-variable errors
  (`disabledRemoteMigrationRepository.ts` and `_settlementAttachments` in the
  Supabase adapter), plus 12 hook warnings. The unused declarations were
  confirmed present in HEAD; they remain unresolved.
- No deployment, production data changes, or live-account login test performed.
  Next: existing-account password setup/recovery and the user-facing login form.

### Password Setup And Recovery Backend (2026-10-20)

- Added `requestPasswordReset` using Supabase `resetPasswordForEmail` and
  `updatePassword` using `getUser` verification followed by `updateUser`.
  Existing identities are retained; neither operation writes household records.
- Password update requires the expected authenticated user ID and at least
  eight characters; the server remains authoritative for password requirements
  and any required reauthentication. Password whitespace is preserved.
- Recovery callbacks reject non-HTTPS URLs except loopback HTTP previews,
  URL credentials, and fragments. The upcoming UI must use a fixed same-origin
  callback route; Supabase redirect allowlisting must be verified before release.
- Disabled/prototype adapters explicitly reject password setup and recovery.
- Corrected `useAuthSession.signIn` to return a success/failure result, and
  diagnostics no longer announces a magic link after a failed request.
- `npm.cmd test`: 313 passed, 1 optional backup-file test skipped, 0 failed.
  `npm.cmd run build` and `git diff --check` passed. Targeted lint reports only
  the previously recorded `_settlementAttachments` unused-variable error.
- The recovery callback, PASSWORD_RECOVERY handling, password confirmation
  screen, and expired-link/same-browser acceptance remain pending. Backend tests
  do not constitute end-to-end recovery verification. No deployment or live
  account password change was performed.
- Implementation references: [Supabase recovery](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
  and [authenticated password updates](https://supabase.com/docs/reference/javascript/auth-updateuser).

## Guardrails

The login screen implementation and current verification evidence are recorded
in [Sprint 106 Login Acceptance](../qa/Sprint-106-Login-Acceptance.md). This
supersedes the earlier UI-pending progress notes above. Live acceptance and
deployment remain pending.

- Email is the login identifier for this sprint; custom usernames are deferred.
- Do not store passwords in localStorage, IndexedDB, logs, backups, or application
  tables. Use Supabase authentication APIs rather than custom password handling.
- Do not auto-create duplicate users or let a login/invite request choose an
  unauthorized household or role.
- Recovery links require a dedicated, validated recovery flow. Do not treat a
  recovery session as completion of a password change.
- Existing users may need one verified email/setup step to establish a password;
  routine logins thereafter should not require magic links.
- Do not expose previous-session private data or render incomplete data as zero
  balances. Do not resolve cache problems by deleting financial records.
- No finance calculation changes, production resets, automatic backup imports,
  or Google OAuth client reclassification.
- Private-storage isolation stays disabled. If switching tests reveal a cache
  privacy defect, it blocks release and needs a focused fix, not a blind reapply
  of the reverted isolation implementation.

## Release Acceptance

Run frontend tests, build, targeted lint, and auth regression tests. Verify
password login, wrong password, sign-out, existing-account setup, expired or
reused recovery/invitation links, unauthorized invitations, refresh, and account
switching. Verify access boundaries using server evidence separately from UI
checks. Compare records and balances with the fresh user-accepted backup without
restoring it into production.

No password-login feature has been deployed by opening this sprint. Broader
unfinished Sprint 105 launch gates remain open; this sprint is not public beta
launch approval.
