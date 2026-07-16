# Home Finance OS v0.11.0-alpha

## Savings Goals and Sinking Funds

**Release Date:** July 16, 2026
**Status:** Alpha Release
**Sprint:** Sprint 11

---

## Overview

Home Finance OS v0.11.0-alpha introduces complete savings-goal and sinking-fund management for the single active household.

Household members can now create savings goals, define target amounts and dates, record contributions and withdrawals, make signed balance adjustments, and review itemized savings activity.

Goal balances are derived from saved activity records rather than stored as duplicate totals. Savings activities may optionally affect an eligible asset account, with ownership validation, safe reversal, and rollback protection during edits and deletions.

This release also adds household savings summaries to the Savings page and main Dashboard, persists all savings records through versioned localStorage, and includes savings data in the existing Reset All Data workflow.

---

## Key Features

### Savings Goals

Users may create goals for:

* Emergency funds
* Vacations
* Annual insurance
* Home repairs
* Tuition
* Vehicle maintenance
* Appliance replacement
* General savings
* Other custom purposes

Each goal supports:

* Goal name
* Description or notes
* Goal type
* Target amount
* Optional target date
* Optional linked household asset account
* Priority
* Status
* Active state
* Created and updated dates

The saved amount is not stored directly on the goal.

It is derived from active savings activities.

---

### Savings Activities

Savings goals support three activity types:

* Contribution
* Withdrawal
* Adjustment

Contributions increase the saved amount.

Withdrawals decrease the saved amount.

Adjustments use a signed value:

* Positive adjustments increase savings.
* Negative adjustments decrease savings.

Each activity records:

* Household
* Savings goal
* Responsible household member
* Activity type
* Amount
* Activity date
* Optional affected asset account
* Notes
* Active state
* Created and updated dates

Inactive activities remain in history but are excluded from goal progress.

---

### Goal Progress

HFOS calculates savings progress from active activities.

Progress information includes:

* Saved amount
* Target amount
* Remaining amount
* Progress percentage
* Overfunded state
* Completed state
* Target date
* Days remaining
* Overdue state
* Required monthly contribution
* Timeline status

Supported timeline states include:

* No Target Date
* Upcoming
* Due Today
* Overdue
* Completed

Progress bars are visually capped at 100 percent while the displayed percentage may exceed 100 percent for overfunded goals.

---

### Required Monthly Contribution

Goals with a future target date display an estimated monthly contribution needed to reach the remaining target.

The calculation uses:

* Remaining savings amount
* Calendar days remaining
* An average month duration
* A minimum calculation period of one month

Completed goals and goals without a usable future deadline do not require a monthly contribution estimate.

---

### Active, Completed, and Archived Goals

The Savings page separates goals into:

* Active Goals
* Completed Goals
* Archived Goals

Active goals include goals still being funded or temporarily paused.

Completed goals remain visible after reaching their target. Users may continue recording withdrawals or adjustments when the goal remains active.

Archived goals preserve their progress and activity history for review, but further goal and activity changes are blocked.

---

### Goal Details and Activity History

Each goal provides a detailed view containing:

* Goal information
* Priority and status
* Saved, target, and remaining amounts
* Progress percentage
* Target date
* Timeline state
* Required monthly contribution
* Linked account
* Created and updated dates
* Itemized activity history

Activity history displays:

* Activity type
* Signed savings effect
* Activity date
* Household member
* Affected account
* Notes
* Active or excluded state
* Last updated date

---

### Account Balance Effects

Savings activities may optionally affect an eligible asset account.

Account behavior follows these rules:

```text
Contribution
or positive adjustment
-> decreases the selected asset account

Withdrawal
or negative adjustment
-> increases the selected asset account

An activity may also be recorded without an account effect.

Account balance effects are handled through the existing Account service.

Account Ownership and Privacy

Savings activity account selection follows existing HFOS privacy rules.

Eligible activity accounts include:

Active household asset accounts
Active private asset accounts owned by the selected member

A member cannot use another member's private account.

Goal-level account linking is limited to active household asset accounts because the goal itself does not identify a private account owner.

Administrator status does not override private account ownership.

Savings Validation

Savings goal validation includes:

Active household validation
Required goal name
Supported goal type
Positive target amount
Valid optional target date
Supported priority
Supported status
Valid active household asset account linking

Savings activity validation includes:

Active household validation
Existing savings goal validation
Active household member validation
Supported activity type
Positive contribution and withdrawal amounts
Nonzero signed adjustment amounts
Valid activity date
Eligible asset account validation
Private account ownership validation
Available account balance validation
Prevention of negative savings balances
Safe Editing and Deletion

Editing an activity safely removes the original savings and account effects before applying the replacement activity.

The workflow:

Calculates the balance without the original activity.
Validates the replacement activity.
Reverses the original account effect.
Applies the replacement account effect.
Persists the updated activity.
Rolls back completed operations if a later step fails.

Deleting an activity reverses its linked account effect before removing the record.

If persistence fails, completed account operations are rolled back.

This prevents duplicate or partially applied balances.

Goal Deletion and Archiving

A savings goal without activity history may be deleted.

A goal with activity history cannot be deleted directly.

It must be archived so that:

Historical activities remain available
Derived savings totals remain explainable
Account-linked financial history is preserved
Referential integrity is maintained
Versioned Savings Persistence

Sprint 11 adds versioned localStorage records for:

hfos.v1.savings-goals
hfos.v1.savings-activities

Savings repositories follow the existing Sprint 10 persistence rules:

Initialize an empty collection only when the storage key is missing.
Preserve intentionally stored empty arrays.
Serialize Date values before saving.
Hydrate stored date strings into Date instances.
Return defensive copies.
Reject malformed records.
Do not silently replace unsupported stored data.
Restrict records to the active household.

No demo savings records are automatically seeded.

Savings Summary

The Savings page includes a household summary showing:

Total saved
Combined target amount
Remaining amount
Overall progress percentage
Active goal count
Completed goal count

Summary values are calculated from current goal progress rather than stored separately.

Dashboard Savings Widget

The main Dashboard now includes a Savings Goals widget.

The widget displays:

Total saved
Combined target
Remaining amount
Overall progress
Active goal count
Completed goal count

The widget uses the existing Savings hook and progress service.

It does not introduce a second savings-calculation path.

Reset All Data

The existing Reset All Data workflow now removes:

Savings activities
Savings goals

Activities are removed before goals because activities reference savings-goal identifiers.

Savings data is removed before accounts and household records.

Architecture

Sprint 11 follows the existing HFOS feature architecture:

Savings UI
-> useSavings
-> Savings Services
-> Savings Validators
-> Savings Repositories
-> Versioned localStorage

The Savings feature contains:

components/
hooks/
models/
pages/
repositories/
services/
validators/

Business calculations remain in services.

Persistence remains in repositories.

Form components remain controlled presentation components.

The page coordinates dialogs and user actions without duplicating savings or account calculations.

Privacy Rules

HFOS remains a strictly single-household application.

All savings goals and activities belong to the one active household.

Savings privacy rules include:

Private accounts remain visible only to their owners.
A member cannot use another member's private account for savings activity.
Goal-level account linking does not expose private accounts.
Savings activity history may identify the responsible household member.
Account details are resolved only from accounts available in the active household.
Administrator status does not bypass private account ownership.

True security still requires future authentication and server-side authorization.

Fixes and Protections

This release prevents:

Savings withdrawals from reducing a goal below zero
Negative adjustments from reducing a goal below zero
Contributions from overdrawing a selected asset account
Positive adjustments from overdrawing a selected asset account
Members from using another member's private account
Goals with activity history from being permanently deleted
Activity edits from duplicating account effects
Activity deletion from leaving an account effect applied
Persistence failures from leaving partially applied account changes
Malformed persisted savings data from being silently replaced
Completed goals from disappearing immediately after reaching their target
Archived goals from accepting new savings activity
Verification

Sprint 11 was verified through production builds, ESLint, and source validation.

Verified behavior includes:

Savings models and form models compile successfully
Savings repositories compile with versioned persistence
Savings validators compile with ownership and balance rules
Savings progress calculations compile successfully
Goal and activity services compile with rollback protection
Savings hook compiles with derived summaries
Savings forms, cards, lists, details, history, toolbar, and summary compile successfully
The functional Savings page compiles successfully
Savings records are included in Reset All Data
The Dashboard Savings widget compiles and registers successfully
TypeScript and Vite production build completes with zero errors
ESLint completes with zero errors
git diff --check completes with no whitespace errors

The final observed Vite build transformed:

2130 modules

The Vite build continues to report a non-blocking warning for a JavaScript bundle larger than 500 KB.

Known Limitations
Browser-Only Persistence

Savings records use browser localStorage.

Data remains limited to the current browser profile.

There is no:

Cloud database
Cloud backup
Cross-device synchronization
Shared multi-user session
Server-side authorization
No Authentication

HFOS does not yet know which household member is signed in.

Savings activity member selection remains manual.

Private account ownership is validated against the selected activity member, but true security requires authenticated identity.

After authentication is introduced:

Ordinary members should be locked to their authenticated identity.
Administrators may be allowed to select another member only where explicitly permitted.
Private account details must remain owner-only.
Goal-Level Private Account Linking

A savings goal does not currently have a member owner.

Because of this, goal-level linked accounts are limited to household asset accounts.

Private accounts may still be selected for individual savings activities when owned by the selected member.

A future permission and ownership model may support member-owned private savings goals.

No Automatic Bank Transfers

Savings account effects are bookkeeping operations inside HFOS.

The application does not connect to banks or initiate real transfers.

No Recurring Contributions

Sprint 11 does not include:

Scheduled recurring contributions
Automatic monthly transfers
Contribution reminders
Deadline notifications
Savings automation rules
No Dedicated Goal Ownership

Savings goals currently belong to the active household rather than an individual member.

Activities identify the responsible member, but goals do not yet support private member ownership or visibility.

No External Alpha Deployment

Sprint 11 completes the local Savings feature but does not introduce:

Hosted deployment
Tester accounts
Feedback collection
Usage analytics
Error monitoring
Bundle Size

The production JavaScript bundle remains above Vite's default 500 KB warning threshold.

Future optimization should include:

Route-level lazy loading
Dynamic imports
Vendor chunk separation
Bundle analysis
Next Sprint

Sprint 12 should focus on stabilization and preparation for external alpha testing.

Recommended scope:

Browser regression testing for all Savings workflows
Settlement receipt attachments
Improved user-facing persistence errors
Mobile layout review
Empty-state and accessibility cleanup
Route-level code splitting
Sample-data controls
External deployment preparation
Tester documentation
Feedback collection workflow
End-to-end application regression testing
Release Result

Home Finance OS v0.11.0-alpha replaces the Savings placeholder with a complete local savings-goal and sinking-fund system.

The application now connects:

Savings goals
Target amounts and deadlines
Contributions
Withdrawals
Adjustments
Household members
Asset accounts
Private account ownership
Derived goal progress
Activity history
Safe edit and deletion reversal
Versioned persistence
Dashboard summaries
Application reset

HFOS now supports planning and tracking future household expenses alongside its existing accounts, transactions, utilities, shared expenses, and settlements.
'@ | Set-Content -Path docs\releases\RELEASE_NOTES_v0.11.0-alpha.md
-Encoding utf8