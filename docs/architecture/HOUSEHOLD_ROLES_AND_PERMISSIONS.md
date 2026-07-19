# HFOS Household Roles And Permissions

## Purpose

This document defines the future role model for authenticated HFOS households.

The current app has local household roles, but those roles are not backed by server-side authentication yet. Future implementation must enforce these permissions in the backend before presenting them as security guarantees.

---

## Role Summary

| Role | Purpose | Current Local Equivalent |
| --- | --- | --- |
| Owner | Household controller and final authority. | `owner` |
| Admin | Trusted household manager. | `admin` |
| Member | Normal participant in household finances. | `member` |
| Viewer | Future read-only observer. | Not implemented |

---

## Permission Matrix

| Capability | Owner | Admin | Member | Viewer |
| --- | --- | --- | --- | --- |
| View household dashboard | Yes | Yes | Yes | Yes |
| View household accounts | Yes | Yes | Yes | Yes |
| View another member's private account | No, unless explicitly shared | No, unless explicitly shared | No | No |
| Create household accounts | Yes | Yes | Yes | No |
| Create private accounts | Yes | Yes | Yes | No |
| Edit own private account | Yes | Yes | Yes | No |
| Edit household transactions | Yes | Yes | Yes | No |
| Edit settlements | Yes | Yes | Yes | No |
| Manage savings goals | Yes | Yes | Yes | No |
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
* Members may participate in records but cannot manage membership.
* Viewers should remain deferred until the backend can enforce read-only access.

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
