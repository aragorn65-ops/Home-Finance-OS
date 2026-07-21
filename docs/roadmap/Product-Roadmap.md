# Home Finance OS Product Roadmap

## Current Direction

HFOS has moved from feature expansion into beta hardening.

Sprints 33-36 focused on reliability, test coverage, data safety, and UX polish
before a private local-first beta decision. Sprint 37 prepared the guided tester
process around that decision. Sprint 38 moves the beta candidate toward a
repeatable Cloudflare Pages deployment.

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

---

## Beta Target

The near-term beta target is a private local-first beta.

Production cloud sync, multi-device shared households, and production auth provider integration remain post-hardening decisions unless they become necessary for beta safety.

The current gate is a deployed Cloudflare Pages beta smoke check using sample or
low-risk data, local backup expectations, and structured issue intake.

---

## Later Candidates

* Production auth provider selection.
* Remote storage adapter implementation.
* Multi-device sync and conflict handling.
* Additional finance modules after beta stabilization.
* Public beta or production release planning.
