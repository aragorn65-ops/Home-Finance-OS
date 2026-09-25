# Sprint 105 Access Audit

Date: 2026-09-25. Repository baseline: `3c69df3`.
Static source inspection only; deployed database definitions have not been read.

## Deployed Evidence And First Repair

The product owner subsequently supplied the installed function definitions and
table policies. Snapshot/create/update RPCs are owned by postgres and use
SECURITY DEFINER; the visibility and viewer-role findings are present in those
definitions. The update guard additionally uses NULL-sensitive NOT IN without
requiring active membership, and checks proposed rather than original parties.
An authenticated outsider can pass the NULL guard; an uninvolved member can
attempt to adopt an existing settlement by naming themselves in the update.

Prepared `docs/architecture/supabase-settlement-write-access-fix.sql` as the
first, write-authorization-only repair. It patches only the two audited RPC
definitions, aborts on unexpected signature counts/anchors, is transactional
and idempotent, and reloads the API schema cache. It changes no financial rows.
Run this targeted file, not the full spike schema or the older identity script.

Verification: `scripts/test-settlement-write-access.mjs` passes on disposable
PGlite PostgreSQL for signed-out, viewer, inactive, other-household, uninvolved,
member, admin, and owner cases; it checks migration idempotency, unchanged
settlement rows, and unexpected-schema refusal. Frontend: 277 tests and build
passed. Production application and legitimate edit smoke test remain pending.

Snapshot private-record filtering and participant-only read policies remain
open, not fixed by this write patch. Filtering core snapshots requires checking
subsequent full-snapshot saves to avoid deleting records hidden from the writer.
Do not mark the entire backend authorization gate passed yet.

## Findings

### High: Snapshot RPC Does Not Enforce Record Visibility

`docs/architecture/supabase-spike-schema.sql`, function
`load_household_core_snapshot(uuid)`, uses SECURITY DEFINER and checks active
membership, then selects accounts, transactions, allocations, and provider bills
by household only. It does not reproduce the table policies' private-record
filters. With the usual privileged function owner this bypasses those policies
and can return other members' private records to an active household member.
Client-side hiding is not a substitute for server-side filtering.

This does not establish cross-household exposure: the function checks membership
for the requested household and scopes its queries to that household. Confirm
the installed definition, owner, and RLS configuration before remediation.

### High: Viewer Settlement Writes Need A Server Role Check

The repository create/update settlement RPCs check active membership and allow
non-admin writes when the caller is payer or receiver. They do not explicitly
require the non-admin role to be `member`. A viewer linked as a participant can
therefore pass that guard. The frontend authorization helper rejects viewers,
but a direct RPC call need not use that helper. Confirm deployed definitions.

### Medium: Participant Visibility Is Broader In SQL

The transaction read policy uses `visibility <> 'private'`, which includes
participant-only records without checking whether the caller is allocated a
share. The allocation policy uses the same broad visibility condition. Include
participant and nonparticipant fixtures in server-side regression coverage.

## Corrected Test Expectations

* Member Accounts is not entirely read-only: current authorization permits
  managing the signed-in member's own private accounts, not household accounts
  or another member's private accounts. This is not a promise of personal
  account cloud persistence.
* Members may create and update involved settlements; Delete remains denied.
  Viewers cannot create/update/delete settlements in the frontend.
* Member Settings is accessible; household management and backup/reset controls
  remain owner/admin gated. Member appearance controls are separately available.
* Passing hidden-control UI checks does not prove direct RPC authorization.

## Next Gate

### Member/Viewer Read Patch Prepared

`supabase-member-read-privacy-fix.sql` filters member/viewer snapshot reads and
direct transaction/allocation/provider-bill reads. Shared household records stay
visible; private records require ownership/payer/creator access, and participant
records require participation. Snapshot account reads exclude other members'
private accounts for non-admin sessions. Membership checks remain household
scoped. The migration does not update financial rows.

Important scope: owner/admin snapshot access remains unchanged because the
existing admin-only save RPC treats omitted rows as deletions. This patch does
not promise owner-only privacy from household admins. Already downloaded browser
data and backups cannot be revoked by database filters. Current local-only
private-account preservation and full-snapshot replacement require a separate
cache/write-path audit before claiming comprehensive private-data isolation.

Verification: `scripts/test-member-read-privacy.mjs` exercises the real snapshot
RPC and direct RLS queries under an authenticated role in disposable PostgreSQL.
Owner/admin results match the old baseline; member/viewer filtering, inactive,
other-household and signed-out rejection, idempotency and unchanged transaction
rows pass. Production application and shared-balance smoke test remain pending.
No live database was accessed by the test script.

Run `docs/architecture/supabase-access-readonly-audit.sql` in Supabase SQL Editor.
It reads installed function definitions and policy metadata only; it does not
read financial rows or change data, roles, policies, or schema cache.

After comparing installed definitions, reproduce the findings in disposable
database fixtures for owner, admin, member, viewer, inactive membership,
signed-out, and another household. Prepare a narrowly scoped migration and
verify household finance results are unchanged before requesting application.
Do not run the full schema as a diagnostic or patch production speculatively.

Release recommendation: keep backend access verification open. No production
data changes, calculation changes, or launch approval resulted from this audit.
