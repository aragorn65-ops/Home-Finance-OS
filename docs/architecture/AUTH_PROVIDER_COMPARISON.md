# HFOS Auth Provider Comparison

## Purpose

This comparison supports the Sprint 40 auth and cloud decision. It scores
candidate auth/storage paths against HFOS household-finance requirements before
any production implementation begins.

---

## Evaluation Criteria

| Criterion | Why It Matters |
| --- | --- |
| Household tenancy | Every record belongs to one household tenant. |
| Private member records | Private accounts, income, cash-flow, and net-worth reports need member-level access rules. |
| Relational finance data | Transactions, allocations, settlements, savings, and accounts reference each other. |
| Migration checkpoints | Local-to-auth migration needs draft, validate, commit, and abort states. |
| Backup restore approval | Shared-household restore requires owner review and summary. |
| Conflict/audit readiness | Money and ownership conflicts need timestamps, versions, and review paths. |
| Cloudflare Pages fit | The deployed frontend should integrate without forcing a hosting move. |
| Operational simplicity | The beta should avoid unnecessary backend maintenance burden. |

---

## Comparison Matrix

Scores use:

```text
1 = weak fit
2 = workable with caveats
3 = strong fit
```

| Option | Tenancy | Private Records | Relational Data | Migration | Restore Approval | Conflict/Audit | Pages Fit | Ops Simplicity | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Supabase Auth + Postgres/RLS | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 23 |
| Firebase Auth + Firestore | 2 | 2 | 2 | 2 | 2 | 2 | 3 | 3 | 18 |
| Cloudflare-native storage + API | 2 | 2 | 2 | 2 | 2 | 2 | 3 | 2 | 17 |
| Custom backend auth/storage | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 1 | 21 |

---

## Option Notes

### Supabase Auth + Postgres/RLS

Best fit for HFOS's relational model. Household records naturally map to tables
with foreign keys, migrations can be represented as drafts and batches, and
row-level security can enforce household membership and private member access.

Caveat: RLS must be designed carefully and tested. It adds more data-model
discipline than Firebase but fits the domain better.

### Firebase Auth + Firestore

Strong operational simplicity and mature authentication. It can work for
households, but HFOS has many relational references: transactions,
allocations, settlements, settlement applications, accounts, and savings
activity. Those relationships are easier to keep consistent in a relational
store.

Caveat: security rules and denormalized data models may become harder to reason
about for private finance records and restore/migration workflows.

### Cloudflare-Native Storage + API

Good deployment alignment with Cloudflare Pages. Could use Workers plus
Cloudflare storage primitives, but HFOS would need a deliberately designed API
and authorization layer.

Caveat: auth/provider decisions and relational consistency still need solving.
This path is attractive only if keeping the whole stack Cloudflare-native
becomes a priority.

### Custom Backend Auth/Storage

Can fit the domain exactly, but creates the highest implementation and
maintenance burden. Not recommended for the next beta-stage slice unless a
hosted provider cannot meet the security and migration requirements.

---

## Provisional Recommendation

Use Supabase Auth + Postgres/RLS as the leading candidate for the next
implementation spike.

Reasoning:

* HFOS household finance data is relational.
* Private member data can be enforced with tenant and member-link policies.
* Migration checkpoints map cleanly to relational tables.
* Restore approval and conflict metadata are easier to model with explicit
  records.
* Cloudflare Pages can remain the frontend host.

---

## Recommended Next Spike

Before committing to production migration:

1. Create a small Supabase schema draft for households, memberships, accounts,
   transactions, and migration drafts.
2. Write RLS policy sketches for household records and private records.
3. Validate whether the existing `AuthBackendAdapter` can wrap Supabase cleanly.
4. Keep the spike read/write isolated from real beta household data.

If the spike exposes RLS or migration complexity that feels too high, revisit
Firebase and Cloudflare-native options before implementation.
