# Home Finance OS Sprint 28

## Auth Diagnostics UI

**Release:** v0.28.0-alpha
**Date:** July 19, 2026
**Branch:** sprint-28-auth-diagnostics-ui
**Status:** In progress

---

## Sprint Objective

Sprint 28 exposes the auth prototype diagnostics in Settings for local QA.

The diagnostics panel is hidden unless auth is explicitly feature-enabled. Normal local-first HFOS users continue to see no auth diagnostics surface.

---

## Planned Scope

* [x] Add compact auth diagnostics panel.
* [x] Show diagnostics in Settings only when auth is feature-enabled.
* [x] Include diagnostics refresh action.
* [x] Avoid displaying secrets, tokens, or provider credentials.
* [x] Keep default local-first Settings unchanged.

---

## Implementation Notes

Sprint 28 adds the diagnostics UI behind the existing auth feature flag:

* `AuthDiagnosticsPanel` renders provider, session, adapter, membership, and invitation state.
* Settings renders the panel only when `isAuthFeatureEnabled()` is true.
* The refresh action reloads diagnostics from the current adapter.
* The panel does not display secrets, tokens, provider credentials, or backup data.

---

## Security Rules

Sprint 28 should:

* Keep diagnostics read-only.
* Hide diagnostics unless auth is explicitly enabled.
* Avoid exposing secrets or account tokens.
* Keep prototype diagnostics separate from app lock.

Sprint 28 should not:

* Add production auth provider UI.
* Persist diagnostics.
* Upload household data.
* Require sign-in for local-first HFOS.

---

## Verification Targets

```text
npm.cmd run build
npm.cmd run lint
git diff --check
```
