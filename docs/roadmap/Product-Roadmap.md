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
