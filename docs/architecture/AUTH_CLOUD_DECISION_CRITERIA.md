# HFOS Auth And Cloud Decision Criteria

## Purpose

This document turns the existing auth, migration, role, and cloud-sync notes
into decision criteria for the first production auth/cloud implementation.

HFOS should not start production cloud migration until each required decision
has an explicit answer.

---

## Current Product Boundary

HFOS is a deployed local-first beta. Cloudflare Pages hosts the static app
shell. Household data is stored in the browser unless a tester manually exports
or restores a backup.

Google Drive backup is optional and remains disabled unless the deployed build
has `VITE_GOOGLE_CLIENT_ID` configured.

---

## Decision Principles

* Local-first mode remains usable without login.
* Migration to authenticated storage is explicit, never automatic.
* A backup checkpoint is created before remote writes begin.
* Failed migration leaves browser-local data usable.
* Server APIs enforce household tenancy, role permissions, and private-record
  access independently from the UI.
* Sync favors safety over silent merging while the product is still early.

---

## Required Decisions

### 1. Identity Provider

Choose the production identity provider and session model.

Criteria:

* Supports email-based sign-in suitable for household beta testers.
* Supports stable user IDs for linking to household member profiles.
* Supports session refresh and sign-out.
* Has a clear local development and deployed Pages integration story.
* Does not force Google Drive backup or Google login as a requirement for
  local-first use.

Open options:

* Supabase Auth.
* Firebase Auth.
* Cloudflare Access or another Cloudflare-aligned identity path.
* Custom backend auth.

### 2. Remote Storage Boundary

Choose where authenticated household records live.

Criteria:

* Enforces household tenant isolation server-side.
* Supports record-level authorization for private accounts and transactions.
* Supports stable IDs, timestamps, updated-by user IDs, and soft-delete or
  audit metadata.
* Supports migration draft, validation, commit, and abort flows.
* Keeps backup restore as an explicit owner-approved operation.

Open options:

* Backend database with API layer.
* Backend-as-a-service database with row-level security.
* Cloudflare-native storage plus API layer.

### 3. Migration Ownership

Define who can claim, import, and restore a household.

Criteria:

* The signed-in claimant becomes the initial authenticated household owner.
* Existing local members remain member profiles until invited or linked.
* Importing into an existing shared household requires owner approval.
* Backup restore into a shared household requires owner approval and preview.
* Local data is not deleted automatically after successful migration.

### 4. Private Record Enforcement

Define how private records map from browser-local rules to backend rules.

Criteria:

* Household membership is necessary but not sufficient for private access.
* The signed-in user must be linked to the member who owns the private record,
  unless an explicit sharing grant exists.
* Owners do not automatically gain access to another member's private account
  details.
* Member-specific income, cash-flow, net-cash-flow, and net-worth reports stay
  outside shared household analytics.

### 5. Sync And Conflict Boundary

Decide the first sync model before enabling multi-device editing.

Criteria:

* No background destructive merge in the first sync release.
* Money-field conflicts require review before overwrite.
* Delete-vs-edit conflicts remain recoverable and require review.
* Private visibility changes require explicit consent by the affected owner or
  member.
* Backup restore does not silently replace live household records.

### 6. Google Drive Backup

Decide whether Google Drive backup remains optional user-managed backup or
becomes attached to authenticated accounts.

Criteria:

* Local Export Backup remains available either way.
* Drive backup uses minimal Drive scope.
* Manually uploaded Drive files remain restorable through local Import Backup.
* Google Drive is not treated as household authorization.

---

## Recommended First Implementation Slice

The smallest safe production slice is not full sync. It is:

1. Choose identity provider.
2. Implement sign-in/session adapter.
3. Implement remote household tenant creation.
4. Implement migration draft preview from local data.
5. Implement migration checkpoint creation without making remote records the
   source of truth.
6. Verify record counts, totals, ownership link, and private visibility metadata.

Only after this slice passes should HFOS consider live remote reads/writes or
multi-device sync.

---

## Non-Decisions For Sprint 40

Sprint 40 does not choose a provider by code implementation. It prepares the
decision so the next implementation sprint can be intentionally scoped.
