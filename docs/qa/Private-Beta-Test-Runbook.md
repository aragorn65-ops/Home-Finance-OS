# HFOS Private Beta Test Runbook

## Purpose

This runbook gives guided private beta testers a repeatable way to evaluate HFOS
without relying on production auth, production sync, or irreplaceable household
data.

HFOS is a local-first beta candidate. The goal is to find data-safety, workflow,
copy, layout, and restore issues before any wider beta decision.

---

## Before Testing

1. Use sample, test, or low-risk household data.
2. Confirm the app opens at the provided preview or local URL.
3. Create a household and at least two active members.
4. Add one cash or bank account per member involved in testing.
5. Export a backup from Settings before starting any meaningful scenario.
6. Store backup passwords outside HFOS when password protection is enabled.

---

## Auth And Cloud Scope

Normal private beta testing remains local-first. Do not connect production
household data to disposable Supabase projects.

Supabase auth/cloud spike validation is separate from this runbook and should
use only `docs/architecture/SUPABASE_SPIKE_VALIDATION_NOTES.md`.

---

## Core Smoke Path

Run this path once per tester/browser:

1. Create or open a household.
2. Add household members.
3. Add accounts.
4. Add an income transaction.
5. Add a shared expense with member allocations.
6. Add a utility bill when the scenario needs utilities.
7. Review Dashboard and Analytics for the selected month.
8. Record a settlement for an outstanding member balance.
9. Create a savings goal and record one contribution.
10. Export a local backup.
11. Use Clear Test Data and confirm household setup remains.
12. Restore the exported backup and confirm records return.

---

## Data-Safety Checks

Use these checks before reporting HFOS as beta-ready on a tester machine:

* Export Backup creates a `.hfos-backup.json` file.
* Protected export requires an 8-character backup password.
* Protected restore rejects a missing or wrong password.
* Restore preview shows household name, record counts, and link status when
  available.
* Restore does not proceed without confirmation.
* Clear Test Data removes financial records but keeps household setup.
* Reset All Application Data removes the household and returns to first-time
  setup.
* App lock is understood as browser privacy only, not account login.

---

## Device Matrix

Cover at least:

* Desktop width in the latest Chrome or Edge.
* Mobile width in Chrome or Safari when available.
* Light theme.
* Dark theme.

When browser-based automation is unavailable, attach manual screenshots to the
beta feedback issue.

---

## Feedback Rules

Create one issue per problem.

Include:

* Page or workflow.
* Browser and device.
* Theme.
* Selected month.
* Steps to reproduce.
* Expected result.
* Actual result.
* Whether a backup was exported before the issue.
* Screenshots or exact error text.

Use `P0` for data loss or restore failure, `P1` for blocked core workflows, `P2`
for confusing but recoverable issues, and `P3` for polish.

---

## Stop Conditions

Pause beta testing on that browser if:

* Restore fails after a valid backup preview.
* Reset or Clear Test Data does something different from the confirmation copy.
* A saved record cannot be edited or deleted.
* A page becomes unusable on the tester's primary device width.
* An error suggests browser storage is unavailable or corrupted.
