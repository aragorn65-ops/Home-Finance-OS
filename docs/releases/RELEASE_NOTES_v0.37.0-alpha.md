# Home Finance OS v0.37.0-alpha

## Private Beta Test Pack

**Release Date:** July 21, 2026
**Status:** Complete
**Sprint:** Sprint 37

---

## Overview

Home Finance OS v0.37.0-alpha prepares the guided private local-first beta test
process.

This release does not add product features. It adds the operating material
needed to run the beta carefully: a test runbook, structured feedback intake,
updated project status, and clear scope boundaries.

---

## Highlights

* Added a private beta test runbook.
* Added a GitHub beta feedback issue template.
* Updated the README to reflect the current guided private beta candidate state.
* Added Sprint 37 tracking notes and release notes.
* Improved manual settlement Apply Full behavior so a zero settlement amount is
  filled from the selected allocation's outstanding amount.

---

## Beta Scope

The beta remains local-first and guided. Testers should use sample or low-risk
data, export local backups before meaningful scenarios, and treat auth/migration
diagnostics as prototype surfaces.

---

## Deferred

* Public beta launch.
* Production login provider.
* Production cloud sync.
* Shared household invites and collaboration.
* New finance modules.

---

## Closure Validation

* Manual settlement Apply Full behavior passed.
* Private beta runbook functional path passed.
* `npm.cmd test` passed.
* `npm.cmd run build` passed.
