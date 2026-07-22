# Home Finance OS Product Roadmap

## Current Direction

HFOS has moved from feature expansion into beta hardening.

Sprints 33-36 focused on reliability, test coverage, data safety, and UX polish
before a private local-first beta decision. Sprint 37 prepared the guided tester
process around that decision. Sprint 38 moved the beta candidate to a
repeatable Cloudflare Pages deployment. Sprint 39 hardens the deployed beta
experience around local-first data safety, backup/restore confidence, and
post-deploy smoke testing. Sprint 40 prepares the auth and cloud architecture
decision path before any production migration work begins. Sprint 41 starts the
Supabase auth/cloud spike, and Sprint 42 prepares disabled-by-default Supabase
client wiring for disposable-project testing.
Sprint 43 adds a disposable-project magic-link request path behind the same
disabled-by-default Supabase provider configuration.
Sprint 44 handles auth callback/session refresh for that disposable-project
flow.
Sprint 45 adds read-only Supabase household membership lookup for signed-in
disposable-project users.
Sprint 46 exposes those membership results in Auth Diagnostics for
disposable-project verification.
Sprint 47 enriches that diagnostics-only view with read-only household names.
Sprint 48 adds aggregate-only account diagnostics for household and
member-private visibility checks.
Sprint 49 adds aggregate-only transaction diagnostics for household,
participant, and private visibility checks.
Sprint 50 adds read-only migration draft metadata diagnostics without reading
backup or validation payloads.
Sprint 51 hardens Auth Diagnostics so disposable Supabase read failures surface
as warnings instead of hiding the whole diagnostics panel.
Sprint 52 adds an explicit disposable-project Supabase household-claim RPC for
creating the remote household, owner membership, and uploaded migration draft.
Sprint 53 adds metadata-only migration validation scoped to the current
Supabase user and draft id.
Sprint 54 adds a validation RPC that marks owned drafts as validated only
after metadata blockers pass.
Sprint 55 adds an abort RPC that marks owned non-committed drafts as aborted
without deleting local browser data.
Sprint 56 adds a commit RPC that marks owned validated drafts as committed and
returns local-link metadata without importing records, syncing, or deleting
local browser data.
Sprint 57 makes validation, commit, and abort timestamps durable on disposable
Supabase migration drafts and maps them back into diagnostics after refresh.
Sprint 58 surfaces those lifecycle timestamps in the migration checkpoint
diagnostics UI as stable UTC values.
Sprint 59 makes latest migration diagnostics deterministic by selecting the
newest lifecycle timestamp instead of relying on adapter return order.
Sprint 60 orders migration checkpoints by newest lifecycle activity in the
diagnostics panel.
Sprint 61 turns the disposable Supabase spike checks into a clearer QA runbook
covering lifecycle diagnostics, checkpoint ordering, and cross-user RLS checks.
Sprint 62 adds fail-closed adapter guards for malformed Supabase validation,
commit, and abort RPC success payloads.

---

## Near-Term Track

| Release | Focus |
| --- | --- |
| v0.32.0-alpha | Local auth link state |
| v0.33.0-alpha | Data safety hardening |
| v0.34.0-alpha | Storage and auth tests |
| v0.35.0-alpha | UX polish pass |
| v0.36.0-alpha | Beta readiness review |
| v0.37.0-alpha | Private beta test pack |
| v0.38.0-alpha | Cloudflare Pages beta deployment |
| v0.39.0-alpha | Post-deploy beta hardening |
| v0.40.0-alpha | Auth and cloud decision prep |
| v0.41.0-alpha | Supabase auth/cloud spike |
| v0.42.0-alpha | Supabase client wiring readiness |
| v0.43.0-alpha | Supabase magic-link spike |
| v0.44.0-alpha | Supabase auth callback handling |
| v0.45.0-alpha | Supabase membership read spike |
| v0.46.0-alpha | Supabase membership diagnostics |
| v0.47.0-alpha | Supabase household diagnostics |
| v0.48.0-alpha | Supabase account diagnostics |
| v0.49.0-alpha | Supabase transaction diagnostics |
| v0.50.0-alpha | Supabase migration draft diagnostics |
| v0.51.0-alpha | Auth diagnostics fail-soft |
| v0.52.0-alpha | Supabase household claim RPC |
| v0.53.0-alpha | Supabase migration validation |
| v0.54.0-alpha | Supabase validation RPC |
| v0.55.0-alpha | Supabase abort RPC |
| v0.56.0-alpha | Supabase commit RPC |
| v0.57.0-alpha | Supabase migration lifecycle timestamps |
| v0.58.0-alpha | Migration lifecycle diagnostics UI |
| v0.59.0-alpha | Latest migration diagnostics |
| v0.60.0-alpha | Migration checkpoint ordering |
| v0.61.0-alpha | Supabase spike QA runbook |
| v0.62.0-alpha | Supabase RPC result guards |

---

## Beta Target

The near-term beta target is a private local-first beta.

Production cloud sync, multi-device shared households, and production auth provider integration remain post-hardening decisions unless they become necessary for beta safety.

The current gate is an auth and cloud decision pass. HFOS should keep the
deployed local-first beta stable while choosing production auth, remote
storage, and migration boundaries deliberately.
Sprint 42 keeps that work behind explicit Supabase spike configuration so the
Cloudflare Pages beta remains local-first by default.
Sprint 43 continues that constraint while testing magic-link request behavior
only in disposable Supabase projects.
Sprint 44 continues the same guardrails while adding callback/session refresh
behavior for disposable Supabase auth tests.
Sprint 45 keeps those guardrails while reading RLS-protected household
membership state for diagnostics only.
Sprint 46 keeps the membership output diagnostics-only and read-only.
Sprint 47 keeps household names diagnostics-only and read-only.
Sprint 48 keeps account diagnostics aggregate-only, read-only, and free of
account names or balances.
Sprint 49 keeps transaction diagnostics aggregate-only, read-only, and free of
amounts, categories, descriptions, or account ids.
Sprint 50 keeps migration draft diagnostics metadata-only and avoids selecting
backup or validation payloads.
Sprint 51 keeps those diagnostics visible during partial Supabase read
failures by collecting warnings and using empty fallbacks.
Sprint 52 keeps Supabase writes limited to one explicit disposable-project RPC
and leaves broad table writes, sync, and real migration disabled.
Sprint 53 keeps migration validation read-only and fail-closed before any
commit or abort behavior is wired.
Sprint 54 keeps validation updates behind one explicit RPC and still leaves
commit, abort, sync, and production migration disabled.
Sprint 55 keeps abort behind one explicit RPC and still leaves commit, sync,
local data deletion, and production migration disabled.
Sprint 56 keeps commit behind one explicit RPC and still leaves full record
import, sync, local data deletion, and production migration disabled.
Sprint 57 keeps lifecycle timestamp persistence metadata-only and still leaves
full record import, sync, local data deletion, and production migration
disabled.
Sprint 58 keeps lifecycle timestamp visibility diagnostics-only and still leaves
full record import, sync, local data deletion, and production migration
disabled.
Sprint 59 keeps latest migration selection diagnostics-only and still leaves
full record import, sync, local data deletion, and production migration
disabled.
Sprint 60 keeps checkpoint ordering diagnostics-only and still leaves full
record import, sync, local data deletion, and production migration disabled.
Sprint 61 keeps Supabase validation disposable-project-only and still leaves
production credentials, full record import, sync, local data deletion, and
production migration disabled.
Sprint 62 keeps lifecycle RPC hardening fail-closed and still leaves production
credentials, full record import, sync, local data deletion, and production
migration disabled.

The Sprint 40 decision criteria are tracked in:

```text
docs/architecture/AUTH_CLOUD_DECISION_CRITERIA.md
docs/architecture/AUTH_PROVIDER_COMPARISON.md
docs/architecture/SUPABASE_SPIKE_PLAN.md
```

---

## Later Candidates

* Production auth provider selection.
* Remote storage adapter implementation.
* Multi-device sync and conflict handling.
* Additional finance modules after beta stabilization.
* Public beta or production release planning.
