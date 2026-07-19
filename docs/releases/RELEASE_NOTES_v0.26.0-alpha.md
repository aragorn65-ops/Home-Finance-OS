# Home Finance OS v0.26.0-alpha

## Auth Prototype Toggle

**Release Date:** TBD
**Status:** In progress
**Sprint:** Sprint 26

---

## Overview

Home Finance OS v0.26.0-alpha makes the in-memory auth prototype selectable through explicit environment settings.

The default app remains local-first with auth disabled. The prototype exists so the session shell can be exercised during local QA without adding a production backend.

---

## Planned Highlights

* Explicit `prototype` auth provider option.
* Adapter factory routing for the in-memory auth prototype.
* Environment documentation for prototype auth QA.

---

## Deferred

* Production Supabase/Firebase/custom adapters.
* Persistent account sessions.
* Remote household storage.
* Cloud sync.
