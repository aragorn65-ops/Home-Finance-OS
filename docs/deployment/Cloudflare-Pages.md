# Cloudflare Pages Deployment

## Purpose

HFOS can be deployed to Cloudflare Pages as a static Vite application for the
public beta candidate.

The current public beta target requires production auth configuration,
cloud-backed household metadata, account/transaction/allocation core snapshots,
utility provider bills, settlement records, limited member transparency and
settlement-entry access, and real-time synchronization for the active household
session. Savings remains a smoke-tested route, but full cloud persistence for
that local module is not a launch blocker unless the public beta scope is
explicitly expanded.

---

## Cloudflare Pages Settings

Use these settings for the GitHub-connected Pages project:

```text
Framework preset: Vite
Root directory: frontend
Build command: npm run build
Build output directory: dist
Production branch: main
Environment variable: NODE_VERSION=22.13.0
Environment variable: VITE_HFOS_AUTH_ENABLED=true
Environment variable: VITE_HFOS_AUTH_PROVIDER=supabase
Environment variable: VITE_SUPABASE_URL=<production Supabase URL>
Environment variable: VITE_SUPABASE_ANON_KEY=<production Supabase anon key>
Optional environment variable: VITE_GOOGLE_CLIENT_ID=<Google OAuth client id>
```

The frontend dependency tree expects Node 22.13.0 or newer for the Vite and
Supabase packages used by the beta build. Keep the Cloudflare Pages
`NODE_VERSION` value aligned with `frontend/package.json`.

The production build exposes a read-only build marker in Settings Auth
Diagnostics. Cloudflare Pages supplies the commit and branch through
`CF_PAGES_COMMIT_SHA` and `CF_PAGES_BRANCH`; Vite embeds them during the build.
Use the displayed short commit to confirm the deployed app includes the
intended `main` checkpoint before running the public beta smoke pass.

The sign-in UI is hidden unless `VITE_HFOS_AUTH_ENABLED=true` and
`VITE_HFOS_AUTH_PROVIDER=supabase` are present at build time. After adding or
changing those auth variables, redeploy the Pages project so Vite embeds the
public beta auth configuration.

If the Cloudflare preset list does not include `Vite`, leave the framework
preset as `None` and enter the build command, output directory, and root
directory manually.

Preview deployments should remain enabled for pull request branches.

Google Drive backup stays disabled unless `VITE_GOOGLE_CLIENT_ID` is configured
for the Cloudflare Pages build. The matching Google OAuth web client must allow
the deployed origin, currently:

```text
https://home-finance-os.pages.dev
```

After adding or changing `VITE_GOOGLE_CLIENT_ID`, redeploy the Pages project so
Vite embeds the new client id.

During beta validation, the production branch may temporarily be set to the
active deployment branch before the branch is merged to `main`. For Sprint 38,
that branch is:

```text
sprint-38-cloudflare-pages-beta-deploy
```

After deployment branch validation is complete and the branch is merged to
`main`, switch the Cloudflare Pages production branch back to `main` and rerun
the deployed smoke check.

---

## Routing

HFOS uses client-side routing. The file below keeps direct route refreshes such
as `/app/settlements` working on Cloudflare Pages:

```text
frontend/public/_redirects
```

The rule rewrites all paths to `index.html` with a `200` response.

---

## Local Validation

Run from `frontend` before relying on a deployment:

```text
npm.cmd test
npm.cmd run build
```

---

## Deployed Smoke Check

After a Cloudflare Pages deployment, verify:

* `/`, `/app`, `/app/household-members`, `/app/accounts`, `/app/transactions`,
  `/app/utilities`, `/app/settlements`, `/app/savings`, `/app/analytics`,
  `/app/help-center`, and `/app/settings` open and refresh without a
  Cloudflare 404.
* Admin sign-in, sign-out, session refresh, and expired-session recovery work.
* A signed-in admin can create or claim one household.
* Household metadata, accounts, transactions, allocations, utility provider
  bills, and settlements survive refresh from the cloud-backed store.
* A limited member can review shared household records and add settlement
  records only when they are the payer or receiver.
* Member access cannot create, edit, or delete accounts, transactions,
  utilities, savings goals or activity, backups, household configuration, or
  migration state.
* Active signed-in admin browser sessions receive cloud-backed household,
  account/transaction snapshot, and settlement changes without manual refresh.
* Backup export creates an `.hfos-backup.json` file.
* Restore preview appears before restore confirmation.
* Clear Test Data keeps household setup.

Use sample or low-risk household data only.
