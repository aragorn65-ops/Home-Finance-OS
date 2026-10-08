# Private Browser Storage Isolation

Implemented locally on 2026-10-04. Production deployment and authenticated
browser smoke verification are pending.

Deployment readiness rechecked on 2026-10-08: all 320 frontend tests, the
production build, targeted storage lint, and `git diff --check` passed.
Publishing is authorized; authenticated production smoke tests remain required.
No database migration or production data reset is part of this release.

## Boundary

Authenticated builds store HFOS application records under
`hfos.user.v1:<encoded-auth-user-id>:<original-key>`. Local-only builds retain
their original storage format. Financial collections, personal-account
archives, attachments, diagnostic records, app lock, theme, and reporting
month use the selected user's storage view. Supabase authentication tokens are
not moved, exported, reset, or enumerated through that view.

The root storage boundary resolves authentication before mounting any routes.
Identity changes lock storage immediately, unmount the application, and reload
the document. A new identity is never mounted over old repository caches or
pending asynchronous work. Same-user token refresh does not reload the app.
Storage handles from an old generation reject subsequent reads and writes,
including after signing back in as the original user.

New user caches are initialized from verified active memberships, remote member
profiles, and the authorized core snapshot before routes are mounted. Failed
initialization is rolled back and displays a retry state, rather than exposing
an empty household that could overwrite cloud records. Existing initialized
user caches remain available for the existing offline/read workflow.

## Legacy Data

Unscoped browser records are left byte-for-byte untouched and are not read as
the next signed-in user's financial cache. They are quarantined by exclusion,
not deleted or automatically assigned to the first person who signs in.
Cloud-backed records reload from the existing authorized cloud source. Local-only
records can be restored from an existing owner-linked backup while signed in
as its recorded owner. Retain pre-upgrade backups and do not clear browser site
data during this migration. Completely unbound legacy data needs explicit
ownership-checked recovery; the app must not guess its owner.

The pre-upgrade browser PIN lock and theme are copied into a new user cache
when no user-specific setting exists. The old browser-wide lock must not be
silently bypassed by the upgrade. Original preference records remain intact;
subsequent changes are user-specific.

Personal-account recovery no longer rewrites an account's household or owner
merely because a linked household has one member. The earlier recovery guard
preserves displaced records with their original identities and fails closed
when preservation fails.

## Backup And Reset

New exports carry `storageOwnerUserId` and contain only the active user's cache.
Restore requires the exporting user to match the current authenticated user;
the household linking user must also match when present. Older backups can
use their existing `authenticatedLink.linkedByUserId` as recorded provenance.
Unbound or conflicting backups are refused without writing records. Encrypted
backups use the same checks after decryption. Switching identity during an
asynchronous export/restore aborts that operation.

Clear Test Data and Reset All Application Data affect only the selected user's
local namespace. They do not delete another user's cache, authentication tokens,
or quarantined legacy records. Their existing cloud behavior is unchanged.

## Limits

This is application-level user isolation, not encryption against someone with
developer-tools, profile-directory, extension, or filesystem access. Backup
owner metadata is provenance, not a cryptographic signature. Password-protect
exported backups when confidentiality is required; possession of an unencrypted
backup exposes its contents outside the app.

Server authorization still governs cloud reads and writes. Existing admin
snapshot visibility is unchanged: this work does not promise private-record
secrecy from a household admin. Complete snapshots are still saved as before;
no financial formulas, schema migrations, allocation records, or settlement
history were changed.

## Verification

320 frontend tests and production build passed. Focused tests cover three-user
storage separation, sign-out, stale handles, namespace enumeration, unchanged
legacy records/auth tokens, same-user backup restoration in a fresh browser
fixture, foreign/unbound/conflicting backups, password-protected backups,
restore cancellation, reset boundaries, and owner/admin/member/viewer bootstrap
from remote fixtures. New storage modules pass targeted ESLint. The broader
touched-file lint run still reports pre-existing issues in
`supabaseAuthBackendAdapter.ts` and `TestSyncSetupPanel.tsx`.

Browser automation reported no available browser. No interactive production
verification or production data changes were performed. After deployment:

1. Confirm the deployed build, then sign in as Dadi and compare cloud balances
   and attachments with the accepted baseline.
2. Sign out and sign in as Rasha in the same browser profile. Confirm a fresh
   load, correct role/name, and no Dadi-only local records. Repeat with Lyn.
3. Return to the original user and verify their own local-only data persists.
4. Export/restore the same user's backup in a fresh signed-in browser; a
   different user's restore must fail without changing current records.
5. Confirm same-user background refresh still preserves an open edit form.

Use disposable fixtures for reset and forced-storage-failure checks; do not
reset the accepted production dataset to test isolation.
