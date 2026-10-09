# Private Storage Redeployment Gate

Date: 2026-10-09 (Asia/Manila)

Status: NOT READY FOR PRODUCTION. The isolation release remains reverted.

## Baseline

The user's latest local backup was inspected read-only. It contains 49
transactions, 147 expense allocations, 14 settlements, 52 settlement
applications, and 13 provider bills. Both new October 5 payments are present,
with their full amounts linked to recorded applications. No orphan settlement
or allocation links were found. This does not establish current cloud parity.

## Release Blockers

1. Compact record payloads total 3,249,837 characters, excluding storage
   envelopes, preferences, auth tokens, and previous isolated caches. Keeping
   the original plus one equivalent user cache requires 6,499,674 characters.
   A per-user localStorage copy strategy cannot assume sufficient browser quota.
2. A synthetic quota-failure probe reproduced silent loss in
   `persistRemoteSettlementRecords`: an existing payment was removed, its
   replacement write failed, no exception was reported, and the repository
   returned zero payments. No real browser or cloud records were used.
3. The reverted first-load isolation bootstrap loads the core snapshot but not
   settlement history/applications before allowing routes to mount. It cannot
   establish a complete balance baseline on its own.
4. Authenticated browser automation is unavailable in this session. The
   earlier source/unit checks did not cover native file-picker focus or real
   browser storage capacity.

## Required Before Deployment

- Make settlement cache replacement failure-aware and preserve the previous
  complete payment/application state if either write fails.
- Use a capacity-appropriate, user-isolated persistence design for attachment
  bodies and caches, with verified migration and no deletion of unclaimed data.
- Complete and verify expense, settlement, and application hydration before
  presenting balances for a newly signed-in user.
- Compare the latest backup against cloud records without uploading a full
  snapshot or recreating payments based only on displayed totals.
- Verify login switching, receipt-only edits, quota failures, and interrupted
  refreshes for owner/member sessions in a browser before marking ready.

No deployment, data reset, backup import, or cloud write was performed during
this readiness check. Pending local receipt/dialog safeguards are separate
from a completed private-storage implementation.

## Focused Settlement Fix, 2026-10-09

The quota-loss reproduction is now covered by regression tests. Remote refresh
writes complete settlement/application collections, checks both writes, rolls
back prior successful writes on failure, and only then reloads repository
memory. Both first-write and second-write failures retain the previous payment
and links after repository reload. This is runtime failure handling, not a
claim of crash-atomic transactions across localStorage keys.

Receipt-only edits preserve recorded manual applications instead of rebuilding
them from the unpaid picker. Draft refresh and accidental dismissal protections,
viewport-level dialogs, and non-scrolling focus handling are included. Storage
quota errors are reported explicitly; no cache is deleted to make room.

Verification: 292 frontend tests and production build passed. An in-memory copy
of the latest backup accepted a synthetic receipt on the 9,260.13 payment,
preserving all six applications and the raw transaction/allocation collections.
The backup file and real browser/cloud records were not modified by this test.
Authenticated browser visual verification and the actual receipt save remain
pending. These fixes do not increase browser storage capacity or complete the
private-storage isolation release.

## Attachment Capacity Candidate, 2026-10-09

Capacity-only release prepared at the user's request after the production upload
continued to fail. Private-storage isolation remains disabled.

- Receipt content is committed to IndexedDB and read back before replacing
  inline localStorage bytes with content references. Financial fields and
  settlement applications are not recalculated or migrated.
- Startup resolves stored references before importing the application. Migration
  touches only known active record keys, preserves unrelated/legacy caches,
  and skips a record changed by another tab while content was being written.
- File pickers await durable content storage. Cloud refreshes stage received
  file content before writing local records. Previews and cloud payloads retain
  the existing inline data URL format in memory.
- Export resolves content into a self-contained portable backup. Restore stages
  its content before replacing local records. Missing content blocks export or
  overwrite instead of silently dropping receipts.
- The latest backup was tested read-only using in-memory localStorage and an
  IndexedDB emulator. Stored record envelopes fell from 3,249,945 to 184,332
  characters. Every record and receipt byte matched after export and restore;
  the source backup file was unchanged.
- Verification: 307 frontend tests passed with the read-only baseline test
  enabled, production build passed, and targeted storage/startup lint passed.

Additional release verification reproduces receipt-only edits on both reported
payments (373.36 and 9,260.13) in isolated storage under a 500,000-character
localStorage quota. A 900 KB synthetic attachment saves, survives repository
reload, and is included in a portable backup. Payment amounts, dates, member
identities, all application links, and non-settlement collections stay unchanged.

Residual verification: real-browser file-picker interaction, preview, and
cross-browser cloud visibility remain unverified because browser discovery
returned no connected browser. This is not a claim that the private-storage
release gate passed. Retain a portable backup and close old-build tabs before
the capacity migration; old builds cannot resolve IndexedDB content references.
Do not roll back to an old build against migrated local records.
Content garbage collection and per-user storage isolation are not implemented
by this capacity change; no old receipt content or unknown cache is deleted.
