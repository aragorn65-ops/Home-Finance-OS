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
  settlement persistence, limited member transparency and settlement entry, and
  route smoke checks.
* Prove the July-to-August partial settlement workflow preserves both the
  recorded payment history and the remaining unsettled balance.
* Keep Utilities provider payment history scoped to the selected payment month
  so earlier payment records do not appear in later-month views.
* Retain the shared reporting month selector on Utilities and Savings during
  production route validation.
* Record production evidence before any public beta tester invitation.

---

## Verified

* Local verification passed with 201 tests.
* Production Supabase cutover, Auth Diagnostics, admin auth, linked refresh
  restore, and July-to-August partial settlement carryover passed.
* Utilities paid provider bills now filter by selected payment month.
* Utilities and Savings show the shared reporting month selector.
* Household Members is now available to members as a read-only transparency
  route while owner/admin sessions keep roster management controls.
* Settings remains available for signed-out and pre-membership auth recovery,
  while household preferences, backup, and reset controls are limited to
  owner/admin sessions in production auth mode.
* Utility provider bills are included in cloud core snapshots for save, load,
  and linked-browser restore.
* Personal accounts are labeled as owner-only in account setup and appear in
  payment account selectors only for the selected owning member.
* Accounts is available to members/viewers as a read-only transparency page;
  personal accounts remain visible only to their owning member.
* Member/viewer tenant-record access is read-only, and settlement correction
  controls remain limited to owner/admin sessions while members can still
  record involved settlement payments.
* Sprint 104 production smoke guides now cover member transparency and full
  signed-out/admin/member/viewer route validation.
* Members can review attachments on transactions they are permitted to view;
  private transaction attachments remain hidden from non-involved members.
* Added a Sprint 104 realtime production smoke guide for two-tab active-session
  sync validation.
* Added a Sprint 104 attachment smoke guide for expense, utility, settlement,
  metadata-only preview, and member-review validation.
* Fixed member personal account visibility after save so a signed-in member's
  own newly created personal account remains visible and counted.
* Hardened member settlement authorization so involved-member create and view
  checks accept local member aliases from the signed-in session.
* Preserved member-created personal accounts across linked member re-entry by
  salvaging local personal accounts into the current linked member shell.
* Expanded member account-owner alias checks so personal accounts remain
  visible after refresh when member identity is represented by a local,
  linked-shell, or Supabase member id.
* Removed the admin household owner fallback from member account creation so a
  member-created personal account is not assigned to the admin owner.
* Added a local archive for member-created personal accounts so they survive
  browser refresh and cloud core snapshot restore in member sessions.
* Member settlement saves now skip the admin-only core snapshot pre-save
  refusal and continue to the settlement RPC, allowing involved members to
  record their own payments without granting core finance write access.

---

## Launch Status

Public beta remains gated until the Sprint 104 production cutover checks pass
on the deployed Cloudflare Pages site.
