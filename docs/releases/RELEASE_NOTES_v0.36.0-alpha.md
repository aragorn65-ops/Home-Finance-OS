# Home Finance OS v0.36.0-alpha

## Beta Readiness Review

**Release Date:** July 21, 2026
**Status:** Complete
**Sprint:** Sprint 36

---

## Overview

Home Finance OS v0.36.0-alpha completes the Sprint 33-36 hardening track with a
private local-first beta readiness review.

The release documents the beta gate, tester expectations, known limitations,
and adds automated coverage for Clear Test Data and Reset All Application Data.

---

## Highlights

* Added a private beta readiness checklist.
* Documented tester data-safety expectations and known limitations.
* Added tests proving Clear Test Data preserves household link state and app
  lock while clearing financial/test records.
* Added tests proving Reset All Application Data removes household link state
  and clears test records.
* Updated the tester guide from private alpha framing to guided private
  local-first beta framing.

---

## Decision

HFOS is a guided private local-first beta candidate.

This release is not a public beta. Testers should use sample or low-risk data,
export backups before meaningful sessions, and treat auth/migration diagnostics
as prototype surfaces.

---

## Deferred

* Public beta launch.
* Production auth provider onboarding.
* Production cloud sync.
* Multi-device shared household collaboration.
* Repeatable browser end-to-end visual QA.
