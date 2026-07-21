# Home Finance OS v0.32.0-alpha

## Local Auth Link State

**Release Date:** July 21, 2026
**Status:** Complete
**Sprint:** Sprint 32

---

## Overview

Home Finance OS v0.32.0-alpha adds local authenticated-link state after a migration checkpoint is committed.

The local household now records which authenticated household and migration checkpoint it was linked to, and the local owner member is linked to the signed-in prototype user.

---

## Highlights

* Optional authenticated household link metadata on local household storage.
* Local owner member linked to the authenticated user after migration commit.
* Auth diagnostics showing local link state and remote household id.
* Claim prompt hidden once a local household is linked.
* Backward-compatible loading for existing unlinked local households.

---

## Deferred

* Production auth provider integration.
* Remote record source-of-truth switching.
* Multi-device sync and conflict resolution.
* Ownership transfer and account recovery flows.
