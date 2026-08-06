# HFOS Household Roles And Permissions

## Purpose

This document defines the role model for authenticated HFOS households.

The production public-beta path now backs household access with Supabase roles.
The UI still hides actions by role, but backend APIs must continue to enforce
the same permissions before any write is trusted.

---

## Role Summary

| Role | Purpose | Current Local Equivalent |
| --- | --- | --- |
| Owner | Household controller and final authority. | `owner` |
| Admin | Trusted household manager. | `admin` |
| Member | Normal participant in household finances. | `member` |
| Viewer | Read-only observer for shared household transparency routes. | `viewer` |

---

## Permission Matrix

| Capability | Owner | Admin | Member | Viewer |
| --- | --- | --- | --- | --- |
| View household dashboard | Yes | Yes | Yes | Yes |
| View household accounts | Yes | Yes | No | No |
| View another member's private account | No, unless explicitly shared | No, unless explicitly shared | No | No |
| Create household accounts | Yes | Yes | No | No |
| Create private accounts | Yes | Yes | No | No |
| Edit own private account | Yes | Yes | No | No |
| View shared transactions, utilities, settlements, savings, analytics, help, and household roster | Yes | Yes | Yes | Yes |
| Edit household transactions | Yes | Yes | No | No |
| Create involved-member settlement records | Yes | Yes | Yes | No |
| Edit settlements | Yes | Yes | No | No |
| Manage savings goals | Yes | Yes | No | No |
| Invite members | Yes | Yes | No | No |
| Change member roles | Yes | Limited, cannot assign owner | No | No |
| Remove members | Yes | Limited, cannot remove owner | No | No |
| Transfer ownership | Yes | No | No | No |
| Import backup into household | Yes | No | No | No |
| Delete household | Yes | No | No | No |

---

## Membership Rules

* A household must always have one active owner.
* Ownership transfer requires the current owner and target member to be active.
* Admins may help manage household operations but cannot remove the owner or take ownership.
* Members may review shared household records and create settlement records
  only when they are the payer or receiver.
* Viewers may review shared household records but cannot create settlement
  records or manage household data.

---

## Private Record Rules

Private accounts and private-account details require two checks:

* The signed-in user has active access to the household.
* The signed-in user is linked to the member who owns the private record, or the record has an explicit sharing grant.

Household owners do not automatically gain private-account visibility unless the product deliberately adds an emergency or consent-based access feature.

---

## Implementation Notes

The existing `HouseholdMember.userId` field should be used as the migration bridge from local member profiles to authenticated users.

The UI may hide actions based on role, but backend APIs must independently enforce the same rules.
