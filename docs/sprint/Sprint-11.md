cd D:\HFOS\Home-Finance-OS

@'
# Sprint 11 - Savings Goals and Sinking Funds

**Release:** v0.11.0-alpha
**Status:** Complete
**Completed:** July 16, 2026

---

## Sprint Goal

Replace the Sprint 10 Savings placeholder with a complete local savings-goal and sinking-fund system for the single active household.

Sprint 11 introduces savings goals, contributions, withdrawals, signed adjustments, derived progress, target deadlines, optional asset-account effects, persistent activity history, household summaries, and Dashboard integration.

The implementation preserves the existing HFOS feature architecture, private-account ownership rules, persistence conventions, OperationResult workflow, and account rollback protections.

---

## Delivered Features

### 1. Savings Domain Models

Added the SavingsGoal domain model.

A savings goal contains:

* Goal identifier
* Household identifier
* Goal name
* Optional description
* Goal type
* Target amount
* Optional target date
* Optional linked asset account
* Priority
* Status
* Active state
* Created date
* Updated date

Supported goal types include:

```text
emergency-fund
vacation
annual-insurance
home-repair
tuition
vehicle-maintenance
appliance-replacement
general
other

Supported priorities include:

low
medium
high
critical

Supported statuses include:

not-started
in-progress
completed
paused
archived

The saved amount is intentionally not stored on the goal.

It is derived from active savings activities.

2. Savings Activity Model

Added the SavingsActivity domain model.

Each activity contains:

Activity identifier
Household identifier
Savings goal identifier
Household member identifier
Activity type
Amount
Activity date
Optional account identifier
Optional notes
Active state
Created date
Updated date

Supported activity types include:

contribution
withdrawal
adjustment

Contribution effects are positive.

Withdrawal effects are negative.

Adjustment effects use the signed amount provided by the user.

3. Savings Form Models

Added controlled form models for:

Savings goals
Savings activities

The goal form supports:

Household
Name
Description
Goal type
Target amount
Target date
Linked account
Priority
Status
Active state

The activity form supports:

Household
Goal
Member
Activity type
Amount
Activity date
Account
Notes
Active state

Default form values are provided for creation workflows.

4. Savings Goal Progress Model

Added a dedicated SavingsGoalProgress model.

Progress output includes:

Goal identifier
Target amount
Saved amount
Remaining amount
Progress percentage
Target date
Days remaining
Required monthly contribution
Completed state
Overfunded state
Overdue state
Timeline state

Supported timeline states include:

no-target-date
upcoming
due-today
overdue
completed
5. Versioned Savings Storage Keys

Added versioned storage keys for:

hfos.v1.savings-goals
hfos.v1.savings-activities

The existing schema version remains unchanged.

Savings records use the same versioned storage-envelope infrastructure introduced in Sprint 10.

6. Savings Goal Repository

Added SavingsGoalRepository.

The repository supports:

Find all goals
Find a goal by identifier
Find goals by household
Create a goal
Update a goal
Delete a goal

Repository behavior includes:

Active-household enforcement
Date serialization
Date hydration
Defensive copies
Structured persistence failures
Missing-key initialization
Preservation of intentionally empty arrays
Malformed-record rejection
Unsupported-storage preservation

No demo savings goals are automatically seeded.

7. Savings Activity Repository

Added SavingsActivityRepository.

The repository supports:

Find all activities
Find an activity by identifier
Find activities by goal
Find activities by household
Create an activity
Update an activity
Delete an activity

The repository applies the same persistence and defensive-copy rules as the goal repository.

No demo savings activities are automatically seeded.

8. Savings Goal Validation

Added SavingsGoalValidator.

Goal validation includes:

Active household validation
Form household validation
Required goal name
Supported goal type
Positive target amount
Valid optional target date
Supported priority
Supported status
Valid linked account
Active linked account
Same-household linked account
Asset-class linked account

Goal-level linked accounts are limited to household-visible asset accounts in the UI because a goal does not currently identify a private account owner.

9. Savings Activity Validation

Added SavingsActivityValidator.

Activity validation includes:

Active household validation
Existing savings goal validation
Same-household goal validation
Active goal validation
Non-archived goal validation
Existing member validation
Same-household member validation
Active member validation
Supported activity type
Positive contribution amount
Positive withdrawal amount
Nonzero signed adjustment amount
Valid activity date
Nonnegative projected savings balance
Existing optional account validation
Same-household account validation
Active account validation
Asset-class account validation
Private-account ownership validation
Available account balance validation

A contribution or positive adjustment cannot exceed the available balance of the selected asset account.

A withdrawal or negative adjustment cannot reduce the goal below zero.

10. Savings Progress Service

Added SavingsProgressService.

The service calculates progress from active activities.

Supported calculations include:

Saved amount
Remaining amount
Percentage complete
Completion state
Overfunded state
Target-date status
Calendar days remaining
Overdue state
Required monthly contribution
Timeline state

Currency values are rounded to two decimal places.

Progress percentages are rounded to two decimal places.

Zero-target calculations are protected against division by zero.

11. Derived Saved Amount

Savings balances are derived from activity history.

The calculation follows:

Contribution
-> positive activity effect

Withdrawal
-> negative activity effect

Adjustment
-> signed activity amount

Inactive activities are excluded.

No duplicate saved-balance field is persisted.

This ensures the displayed balance remains explainable through itemized activity history.

12. Required Monthly Contribution

For an incomplete goal with a future target date, the progress service estimates the monthly contribution required to meet the remaining target.

The calculation uses:

Remaining amount
Days remaining
Average calendar days per month
A minimum period of one month

Required monthly contribution is not returned when:

The goal is complete
No target date exists
The deadline is not in the future
No remaining amount exists
13. Savings Goal Service

Added SavingsGoalService.

The service supports:

Get household goals
Get a goal by identifier
Get active goals
Get completed goals
Get archived goals
Create a goal
Update a goal
Archive a goal
Delete a goal

Service rules include:

Single active household enforcement
Goal validation
Duplicate active-name prevention
Date mapping
Persistence-aware OperationResult responses
Preservation of completed goals
Archive-state handling
Activity-history deletion protection

A goal with activity history cannot be permanently deleted.

It must be archived.

14. Savings Activity Service

Added SavingsActivityService.

The service supports:

Get household savings activities
Get an activity by identifier
Get activities by goal
Create an activity
Update an activity
Delete an activity

The service coordinates:

Savings validation
Goal balance effects
Account balance effects
Historical reversal
Persistence
Rollback protection
15. Contribution Account Effects

A contribution increases the savings goal balance.

When an eligible asset account is selected:

Savings Goal
+ contribution amount

Asset Account
- contribution amount

The account effect represents money being designated or moved into savings within the HFOS bookkeeping model.

An activity may also be recorded without selecting an account.

16. Withdrawal Account Effects

A withdrawal decreases the savings goal balance.

When an eligible asset account is selected:

Savings Goal
- withdrawal amount

Asset Account
+ withdrawal amount

The withdrawal cannot exceed the goal's available saved amount.

17. Adjustment Account Effects

Signed adjustments support historical or reconciliation corrections.

Positive adjustment:

Savings Goal
+ adjustment amount

Asset Account
- adjustment amount

Negative adjustment:

Savings Goal
- absolute adjustment amount

Asset Account
+ absolute adjustment amount

A zero adjustment is rejected.

18. Safe Activity Editing

Editing an activity prevents duplicated goal and account effects.

The update workflow:

Loads the original activity.
Removes the original goal effect virtually.
Calculates the account balance after virtual reversal.
Validates the replacement activity.
Reverses the original account effect.
Applies the replacement account effect.
Persists the updated activity.
Rolls back completed operations if a later operation fails.

Historical account adjustment methods are used when reversing previously saved effects.

19. Safe Activity Deletion

Deleting an activity:

Loads the activity.
Confirms deletion will not make the goal balance negative.
Reverses the linked account effect.
Deletes the activity record.
Restores the account effect if persistence fails.

This prevents deleted activity from leaving its account balance effect applied.

20. Account Operation Rollback

Savings account operations are recorded as reversible operations.

If a multi-step activity update or deletion fails, completed operations are reversed in reverse order.

Rollback protects against:

Partial account updates
Repository failure after an account change
Replacement-account failure during editing
Duplicate balance effects
Lost historical account effects
21. Private Account Ownership

Savings activity account selection follows HFOS private-account rules.

Eligible activity accounts include:

Active household-visible asset accounts
Active private asset accounts owned by the selected member

A private account cannot be used by another member.

Administrator status does not override account ownership.

Changing the selected member clears an incompatible private account.

22. Savings Hook

Added useSavings.

The hook coordinates page state and service operations.

It provides:

Goals
Activities
Active goals
Completed goals
Archived goals
Progress by goal identifier
Household savings summary
Activities by goal
Create goal
Update goal
Archive goal
Delete goal
Create activity
Update activity
Delete activity
Refresh

The hook refreshes Savings state after successful write operations.

23. Savings Summary

Added SavingsSummary.

The summary displays:

Total saved
Combined target amount
Remaining amount
Overall progress
Active goal count
Completed goal count

Progress is derived from the goal progress service.

The progress bar is visually capped at 100 percent.

The displayed percentage may exceed 100 percent when goals are overfunded.

Currency is formatted through Intl.NumberFormat.

24. Savings Toolbar

Added SavingsToolbar.

The toolbar provides:

Savings page title
Savings page subtitle
Add Goal action

It reuses the shared PageHeader and Button components.

25. Savings Goal Form

Added SavingsGoalForm.

The controlled form supports:

Goal name
Description
Goal type
Target amount
Target date
Linked household asset account
Priority
Status
Active state
Field-level error messages

The form reuses shared Input and Select controls.

A native textarea is used because no shared textarea component currently exists.

26. Savings Activity Form

Added SavingsActivityForm.

The controlled form supports:

Household member
Activity type
Amount
Activity date
Optional source or destination account
Notes
Active state
Field-level error messages

Adjustment helper text explains signed values.

Private account options depend on the selected member.

Invalid selected private accounts are cleared when the member changes.

27. Savings Goal Card

Added SavingsGoalCard.

Each card displays:

Goal name
Goal type
Priority
Status
Saved amount
Target amount
Remaining amount
Progress percentage
Progress bar
Target date
Timeline state
Required monthly contribution
Last updated date
Overfunded tag
Overdue tag

Supported card actions include:

View
Add Activity
Edit
Archive
Delete
28. Savings Goal List

Added SavingsGoalList.

The list:

Renders goal cards
Resolves progress by goal identifier
Supports configurable empty states
Passes goal actions to each card
Reuses the same presentation for active, completed, and archived sections
29. Savings Activity History

Added SavingsActivityHistory.

Each history item displays:

Activity type
Signed goal effect
Activity date
Responsible member
Affected account
Updated date
Notes
Active or excluded state

Activities are sorted by activity date and creation date.

Edit and delete actions are supported where permitted.

30. Savings Goal Details

Added SavingsGoalDetails.

The detailed view includes:

Goal information
Goal type
Priority
Status
Saved amount
Target amount
Remaining amount
Progress percentage
Progress bar
Target date
Timeline state
Required monthly contribution
Linked account
Created date
Updated date
Itemized activity history

The component supports:

Edit Goal
Add Activity
Edit Activity
Delete Activity
Close

Archived goals remain reviewable without edit controls.

31. Functional Savings Page

Replaced the Sprint 10 placeholder Savings page.

The page now coordinates:

Goal creation
Goal editing
Goal details
Activity creation
Activity editing
Activity deletion
Goal archiving
Goal deletion
Active goals
Completed goals
Archived goals
Summary metrics
Confirmation dialogs
Validation feedback
Household data
Members
Accounts
Currency

Business calculations remain outside the page.

32. Goal Creation and Editing

Goal creation and editing use the same controlled form.

The page:

Maps domain goals into form values
Maps Date values into date-input strings
Enforces the active household identifier
Displays field-level and general errors
Opens the saved goal details after success
33. Activity Creation and Editing

Activity creation and editing use the same controlled form.

The page:

Preselects the current goal
Uses the household owner or first active member as the initial member
Maps activity dates into date-input strings
Displays field-level and general errors
Returns to goal details after success
34. Goal Confirmation Workflows

The page uses the shared ConfirmDialog for:

Goal archive confirmation
Goal deletion confirmation
Activity deletion confirmation

Confirmation messages explain:

Archived history remains available
Goals with history must be archived
Deleted activity account effects will be reversed
35. Active Goals

The Active Goals section displays goals that are:

Active
Not archived
Not financially completed

Paused goals remain visible in the active section.

Users may:

View
Add Activity
Edit
Archive
Delete when allowed
36. Completed Goals

The Completed Goals section displays goals that:

Reached their financial target, or
Have an explicit completed status

Completed goals remain visible.

When still active and not archived, they may accept:

Withdrawals
Adjustments
Additional contributions
37. Archived Goals

The Archived Goals section preserves:

Goal details
Derived progress
Activity history
Linked-account reference
Created and updated dates

Archived goals do not expose:

Add Activity
Edit Goal
Edit Activity
Delete Activity
38. Dashboard Savings Widget

Added SavingsWidget to the Dashboard.

The widget displays:

Total saved
Combined target
Remaining amount
Overall progress
Active goal count
Completed goal count

The widget uses useSavings and does not duplicate progress calculations.

Currency formatting uses the active household currency.

39. Dashboard Registration

Updated widgetRegistry.

The Savings widget is registered as:

ID: savings-goals
Order: 5
Size: medium
Enabled: true

The Dashboard continues to render enabled widgets in order through DashboardLayoutService.

40. Reset All Data Integration

Updated applicationDataReset.

Reset now removes:

Savings activities
Savings goals

Savings activities are removed before savings goals.

Savings data is removed before accounts and household records.

This preserves dependency-safe reset ordering.

Architecture Delivered

Sprint 11 follows the existing HFOS feature architecture:

UI
|
v
Hook
|
v
Service
|
v
Validator
|
v
Repository
|
v
Versioned localStorage

The Savings feature is organized under:

frontend/src/features/savings/

with:

components/
hooks/
models/
pages/
repositories/
services/
validators/

The implementation preserves:

Feature-based architecture
Repository abstraction
Service-layer business rules
Controlled form components
OperationResult error handling
Defensive data copies
Active-household boundaries
Private-account ownership
Account rollback protection
Versioned localStorage
Derived financial values
Key Files Added
Dashboard Savings Widget
frontend/src/features/dashboard/widgets/savings/SavingsWidget.tsx
Savings Components
frontend/src/features/savings/components/SavingsActivityForm.tsx
frontend/src/features/savings/components/SavingsActivityHistory.tsx
frontend/src/features/savings/components/SavingsGoalCard.tsx
frontend/src/features/savings/components/SavingsGoalDetails.tsx
frontend/src/features/savings/components/SavingsGoalForm.tsx
frontend/src/features/savings/components/SavingsGoalList.tsx
frontend/src/features/savings/components/SavingsSummary.tsx
frontend/src/features/savings/components/SavingsToolbar.tsx
Savings Hook
frontend/src/features/savings/hooks/useSavings.ts
Savings Models
frontend/src/features/savings/models/SavingsActivity.ts
frontend/src/features/savings/models/SavingsActivityForm.ts
frontend/src/features/savings/models/SavingsGoal.ts
frontend/src/features/savings/models/SavingsGoalForm.ts
frontend/src/features/savings/models/SavingsGoalProgress.ts
Savings Repositories
frontend/src/features/savings/repositories/SavingsActivityRepository.ts
frontend/src/features/savings/repositories/SavingsGoalRepository.ts
Savings Services
frontend/src/features/savings/services/SavingsActivityService.ts
frontend/src/features/savings/services/SavingsGoalService.ts
frontend/src/features/savings/services/SavingsProgressService.ts
Savings Validators
frontend/src/features/savings/validators/SavingsActivityValidator.ts
frontend/src/features/savings/validators/SavingsGoalValidator.ts
Documentation
docs/releases/RELEASE_NOTES_v0.11.0-alpha.md
docs/sprint/Sprint-11.md
Major Files Updated
CHANGELOG
frontend/src/features/dashboard/widgetRegistry.ts
frontend/src/features/savings/pages/SavingsPage.tsx
frontend/src/features/startup/services/applicationDataReset.ts
frontend/src/shared/storage/localStorageStore.ts
Verified Workflows

The following Sprint 11 checks were completed:

Compile Savings domain models
Compile Savings form models
Compile Savings repositories
Compile Savings validators
Compile Savings progress calculations
Compile Savings goal service
Compile Savings activity service
Compile Savings rollback logic
Compile useSavings
Compile all Savings components
Compile the functional Savings page
Compile Reset All Data with Savings storage keys
Compile the Dashboard Savings widget
Register the Dashboard Savings widget
Run the production TypeScript and Vite build
Run ESLint
Run git diff --check

Browser-level end-to-end regression testing remains recommended before external alpha distribution.

Build Verification

Commands:

npm run build
npm run lint
git diff --check

Results:

TypeScript Build: PASS
Vite Production Build: PASS
Build Errors: 0

ESLint: PASS
ESLint Errors: 0

Whitespace Check: PASS

The final observed build transformed:

2130 modules

The final observed generated JavaScript bundle was approximately:

677.69 kB

Vite reported a non-blocking warning that the main JavaScript bundle exceeds 500 kB after minification.

Git Verification

Branch:

sprint-11-savings

Before the final commit, run:

git diff --check
git status --short
git diff --stat

Because newly created files are untracked until staging, use:

git ls-files --others --exclude-standard

to verify the complete new-file inventory.

LF-to-CRLF notices may appear on Windows and are not whitespace errors.

Known Limitations
Browser-Only Persistence

Savings data is stored in browser localStorage.

Data is limited to the current browser profile.

There is no:

Cloud database
Cross-device synchronization
Cloud backup
Shared multi-user session
Server-side authorization
No Authentication

HFOS does not yet know which member is currently signed in.

Savings activity member selection remains manual.

Private-account ownership is validated using the selected member.

Future authentication should:

Default activity member to the authenticated user
Lock member selection for ordinary members
Allow administrator changes only where explicitly permitted
Continue enforcing private-account ownership
Household-Level Goals

Savings goals belong to the active household.

Goals do not currently have:

Individual member ownership
Private visibility
Shared participant lists
Permission settings

Savings activities still identify the responsible member.

Goal-Level Private Accounts

A goal does not currently identify an owner.

Goal-level linked accounts are therefore limited to household-visible asset accounts.

Private owned accounts may still be used on individual savings activities by their owner.

No Bank Integration

Account effects are internal bookkeeping operations.

HFOS does not:

Connect to a bank
Initiate a transfer
Confirm external deposits
Reconcile bank statements automatically
No Recurring Savings Rules

Sprint 11 does not include:

Scheduled contributions
Automatic monthly savings
Contribution reminders
Deadline notifications
Recurring adjustment rules
No Dedicated Savings Transactions

Savings activities are persisted in the Savings feature.

They do not currently create standard Transaction records.

The account balance effect is applied through AccountService, but the activity does not appear in the general Transactions list.

A future design decision should determine whether savings transfers should also generate transaction records.

Browser Regression Testing

Build and lint checks pass, but complete browser regression testing remains recommended for:

Goal creation
Goal editing
Goal archiving
Goal deletion
Contribution account effects
Withdrawal account effects
Signed adjustments
Activity editing
Activity deletion
Private account ownership
Persistence after refresh
Reset All Data
Completed-goal behavior
Archived-goal behavior
Responsive layouts
Bundle Size

The production JavaScript bundle remains above Vite's default 500 kB warning threshold.

Future optimization should include:

Route-level lazy loading
Dynamic imports
Vendor chunk separation
Bundle analysis
Deferred to Sprint 12

Sprint 12 should focus on stabilization and preparation for external alpha testing.

Recommended scope:

Full Savings browser regression testing
Full application end-to-end regression testing
Settlement receipt attachments
Improved persistence error feedback
Mobile layout review
Accessibility cleanup
Empty-state cleanup
Route-level code splitting
Sample-data controls
Private deployment preparation
Tester instructions
Feedback collection workflow
Critical alpha issue resolution
v0.12.0-alpha documentation
Future SaaS Path

A multi-user HFOS beta requires server-side identity and persistence.

Future cloud work should include:

User authentication
Household invitations
Owner, administrator, and member roles
Member-owned savings goals
Private savings-goal visibility
PostgreSQL persistence
Row Level Security
Account authorization
Cloud repository implementations
Multi-device synchronization
Audit events
Automated backups
Private document storage
Subscription billing

The single-household rule should remain active within each customer workspace.

Sprint Result

Sprint 11 is complete.

HFOS now supports local savings goals and sinking funds for the active household.

The application now connects:

Savings goals
Target amounts
Target dates
Priorities
Goal statuses
Household members
Contributions
Withdrawals
Signed adjustments
Optional asset accounts
Private account ownership
Derived progress
Required monthly contributions
Activity history
Safe edits
Safe deletion reversal
Versioned persistence
Dashboard summaries
Application reset

The Sprint 10 Savings placeholder has been replaced with a complete Savings feature.

HFOS is ready for final Sprint 11 browser verification, staging, commit, and release closure.
'@ | Set-Content -Path docs\sprint\Sprint-11.md
-Encoding utf8