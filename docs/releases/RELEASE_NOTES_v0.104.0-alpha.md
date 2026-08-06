# Release Notes v0.104.0-alpha

## Public Beta Production Cutover Readiness

Home Finance OS v0.104.0-alpha focuses on live production cutover readiness
after the Sprint 103 settlement and Supabase allocation-sync hardening.

---

## Planned

* Verify the deployed Cloudflare Pages build includes the latest Sprint 103
  closeout commit.
* Apply and validate the latest Supabase schema, including core snapshot
  expense-allocation support.
* Re-run Auth Diagnostics, production auth, linked-household restore, remote
  settlement persistence, limited member settlement entry, and route smoke
  checks.
* Prove the July-to-August partial settlement workflow preserves both the
  recorded payment history and the remaining unsettled balance.
* Keep Utilities provider payment history scoped to the selected payment month
  so earlier payment records do not appear in later-month views.
* Retain the shared reporting month selector on Utilities and Savings during
  production route validation.
* Record production evidence before any public beta tester invitation.

---

## Verified

* Local verification passed with 166 tests.
* Production Supabase cutover, Auth Diagnostics, admin auth, linked refresh
  restore, and July-to-August partial settlement carryover passed.
* Utilities paid provider bills now filter by selected payment month.
* Utilities and Savings show the shared reporting month selector.

---

## Launch Status

Public beta remains gated until the Sprint 104 production cutover checks pass
on the deployed Cloudflare Pages site.
