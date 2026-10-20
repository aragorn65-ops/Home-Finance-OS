# Sprint 107

## Login Loading Performance

**Status:** Preview accepted; promoting the narrow loading optimization to production.
**Started:** 2026-10-20 (Asia/Manila)
**Production baseline:** `6d1a707`, accepted for Dadi Buboy, Rasha, and Lyn.

Investigate the reported slow initial load without weakening membership,
household selection, or complete financial snapshot gates.

### First Change

Household details and member profiles previously loaded sequentially during
bootstrap and explicit household selection. Start these independent reads
together and wait for both before saving the browser link. Existing session
cancellation and verification remain in place. No financial calculations,
database writes, or credential caching changes.

Tests prove both reads start before either resolves, incomplete data is not
returned, and a failed member request rejects the operation. This removes one
serial wait but does not establish the cause or duration of Rasha's live delay.
Live latency measurements and user acceptance remain open.

### Remaining Work

- Measure login-to-data-ready time for existing and fresh browser sessions.
- Identify repeated reads and network/server delays before further changes.
- Recheck same-browser switching and correct balances after refresh.
- Retain the accepted production build until the preview is validated.

### Preview Acceptance

User reported approximately three seconds for Rasha's login and confirmed correct
records/balances without another member's data or false zero balances appearing.
This is a user-reported observation, not a controlled before/after benchmark or a
guarantee for every connection. Build, 320 backend tests (one optional backup test
skipped), and 13 browser tests passed before preview deployment `f8f6fd2`.

Promote this narrow concurrency change without database writes or calculation
changes. Further performance investigation is deferred unless slow loading recurs.
