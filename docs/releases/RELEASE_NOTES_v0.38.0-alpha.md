# Home Finance OS v0.38.0-alpha

## Cloudflare Pages Beta Deployment

**Release Date:** July 21, 2026
**Status:** In progress
**Sprint:** Sprint 38

---

## Overview

Home Finance OS v0.38.0-alpha prepares the guided private beta for Cloudflare
Pages hosting.

This release keeps the app local-first. Cloudflare Pages hosts the static Vite
frontend while HFOS data remains in the tester's browser localStorage.

---

## Highlights

* Added Cloudflare Pages deployment documentation.
* Added a Cloudflare Pages SPA fallback so direct client-side routes can refresh
  correctly.
* Defined deployed beta smoke checks for setup, finance workflows, settlements,
  backup, restore, and Clear Test Data.

---

## Deferred

* Production login provider.
* Production cloud sync.
* Server-side storage.
* Shared household invites and collaboration.
* New finance modules.
