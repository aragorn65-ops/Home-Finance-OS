# Home Finance OS v0.33.0-alpha

## Data Safety Hardening

**Release Date:** July 21, 2026
**Status:** Complete
**Sprint:** Sprint 33

---

## Overview

Home Finance OS v0.33.0-alpha begins the beta-hardening track with data-safety improvements around backups, restore previews, reset copy, and authenticated local-link visibility.

---

## Highlights

* Backup summaries now include linked versus local-only household status.
* Backup summaries can show the remote household id for linked households.
* Backup validation rejects malformed authenticated-link metadata.
* Current Browser Data shows local link status in Settings.
* Restore previews show local link status before data is replaced.
* Clear Test Data and Reset Application Data copy now explicitly explains authenticated link preservation or removal.

---

## Deferred

* Automated storage/auth tests.
* Full visual polish pass across all core pages.
* Production auth provider integration.
* Multi-device sync and conflict resolution.
