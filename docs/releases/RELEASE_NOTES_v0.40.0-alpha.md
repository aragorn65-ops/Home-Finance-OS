# Home Finance OS v0.40.0-alpha

## Auth And Cloud Decision Prep

**Release Date:** July 22, 2026
**Status:** In progress
**Sprint:** Sprint 40

---

## Overview

Home Finance OS v0.40.0-alpha prepares the architecture decision path after the
deployed local-first beta baseline.

This release keeps production auth, cloud sync, Google Drive configuration, and
shared household collaboration out of implementation scope until the decision
criteria are explicit.

---

## Highlights

* Documented current Google Drive backup configuration status.
* Reviewed existing auth and cloud-sync architecture notes.
* Defined production auth/provider decision criteria.
* Defined remote storage and migration decision criteria.
* Identified the next smallest implementation slice after the decision.
* Compared provider/storage candidates and identified Supabase Auth +
  Postgres/RLS as the leading spike candidate.

---

## Deferred

* Production login provider.
* Production cloud sync.
* Server-side storage.
* Shared household invites and collaboration.
* Automatic local-to-cloud data migration.
