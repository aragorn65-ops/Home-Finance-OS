# Sprint 107

## Login Loading Performance

**Status:** Active - first optimization verified locally; preview validation pending.
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
