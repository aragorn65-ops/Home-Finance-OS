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
* Record production evidence before any public beta tester invitation.

---

## Verified

Pending Sprint 104 implementation and live validation.

---

## Launch Status

Public beta remains gated until the Sprint 104 production cutover checks pass
on the deployed Cloudflare Pages site.
