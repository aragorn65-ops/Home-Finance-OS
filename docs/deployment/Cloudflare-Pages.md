# Cloudflare Pages Deployment

## Purpose

HFOS can be deployed to Cloudflare Pages as a static Vite application for the
guided private local-first beta.

The current beta stores household data in the browser. Cloudflare Pages hosts
the app shell only; it does not provide production auth, cloud sync, or shared
household collaboration.

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
```

The frontend dependency tree expects Node 22.13.0 or newer for the Vite and
Supabase packages used by the beta build. Keep the Cloudflare Pages
`NODE_VERSION` value aligned with `frontend/package.json`.

If the Cloudflare preset list does not include `Vite`, leave the framework
preset as `None` and enter the build command, output directory, and root
directory manually.

Preview deployments should remain enabled for pull request branches.

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
* First-time household setup opens.
* Household members can be added.
* Accounts can be added.
* An income transaction can be saved.
* A shared expense creates outstanding settlement balances.
* Manual settlement Apply Full fills a zero settlement amount from the selected
  outstanding allocation.
* Backup export creates an `.hfos-backup.json` file.
* Restore preview appears before restore confirmation.
* Clear Test Data keeps household setup.

Use sample or low-risk household data only.
