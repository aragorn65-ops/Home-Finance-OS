# HFOS Cloud Sync Conflict Policy

## Purpose

This policy defines the first product-level rules for future HFOS cloud sync conflicts.

HFOS does not yet have full cloud sync. These rules should guide backend design and avoid accidental data loss when multi-device editing becomes possible.

---

## Sync Principles

* Server-side household authorization is required before sync.
* Local app lock does not authorize sync.
* Record identity must be stable across devices.
* Deletes should be reversible or auditable during early sync releases.
* Users should see conflicts that affect money, ownership, or private visibility.

---

## Conflict Rules

| Conflict Type | Default Policy |
| --- | --- |
| Different edits to descriptive text | Latest confirmed edit wins, with updated timestamp. |
| Different edits to money fields | Require review before overwrite. |
| Delete vs edit | Keep deleted record recoverable and require review. |
| Private visibility change | Require owner/member consent depending on record owner. |
| Membership role change | Server-authoritative owner/admin action wins. |
| Backup restore vs live changes | Require owner review and restore summary before replacing records. |

---

## Record-Level Requirements

Future synced records should include:

* Stable record ID.
* Household tenant ID.
* Created timestamp.
* Updated timestamp.
* Updated by user ID.
* Optional deleted timestamp.
* Optional version or revision number.

---

## First Implementation Boundary

The first sync release should favor safety over invisibility:

* No background destructive merges.
* No silent household replacement.
* No private-record visibility expansion without explicit action.
* Clear user-facing review for conflicts involving balances, transactions, settlements, and ownership.
