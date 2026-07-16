
--- Sprint 12 Release Notes ---
# Home Finance OS v0.12.0-alpha

## UI Foundation and Responsive Refresh

**Release Date:** July 16, 2026
**Status:** Alpha Release
**Sprint:** Sprint 12

---

## Overview

Home Finance OS v0.12.0-alpha introduces a consistent UI foundation across the application.

This release adds semantic design tokens, refreshed shared components, responsive desktop and mobile layouts, improved Dashboard and Savings presentation, shared currency formatting, and documented UI standards.

The update focuses on readability, consistency, accessibility, and responsive behavior.

Existing financial calculations, household rules, persistence behavior, private-account ownership, and service-layer validation remain unchanged.

---

## Key Features

### Semantic Design Tokens

HFOS now uses a centralized semantic token system for:

* Brand colors
* Canvas and surface colors
* Text hierarchy
* Borders
* Status colors
* Typography
* Spacing
* Border radii
* Control heights
* Focus indicators
* Shadows
* Layout dimensions
* Motion
* Layering

The design tokens are defined in:

```text
frontend/src/styles/theme.css
Shared UI components and application-shell components now use these semantic values instead of duplicated hardcoded presentation rules.

Global UI Reset

The shared reset now provides:

Consistent box sizing
Token-based typography and colors
Form-control inheritance
Table and media defaults
Visible keyboard focus
Reduced-motion support
Safer text wrapping
Predictable full-height layouts

The reset remains presentation-only and does not contain financial or feature-specific rules.

Responsive Application Shell

The application shell now adapts across desktop, tablet, and mobile screens.

Desktop layout preserves:

Sidebar width: 320px
Header height: 64px
Maximum content width: 1280px

Below 1024px, the sidebar becomes an off-canvas navigation panel.

Mobile navigation supports:

Labeled menu control
Sidebar backdrop
Backdrop close
Escape-key close
Close after selecting a navigation item
Route-change synchronization
Responsive page padding
Dynamic viewport height

The Dashboard navigation item now uses exact route matching and no longer appears active on every nested application route.

Shared UI Components

The following shared components were refreshed:

Button
Card
PageHeader
Widget
StatCard
Badge
TimeContext
Dialog
DialogHeader
DialogBody
DialogFooter
ConfirmDialog

Shared components now use:

Scoped HFOS class names
Semantic design tokens
Consistent focus states
Responsive spacing
Accessible naming
Predictable variants
Consistent control sizing

Buttons now default to:

type="button"

This prevents accidental form submissions when the button type is not explicitly provided.

Dialog Presentation

Dialogs now support:

Full-screen overlay positioning
Viewport-safe dimensions
Scrollable content bodies
Stable headers and footers
Default, medium, and large widths
Responsive mobile margins
Bottom-aligned mobile presentation
Token-based borders, surfaces, and shadows
Consistent destructive confirmation messaging

Dialog width modifiers include:

hfos-dialog--medium
hfos-dialog--large
Dashboard Layout

The Dashboard now uses a responsive 12-column grid.

Widget size metadata now affects layout instead of remaining unused configuration.

Supported widget sizes include:

Small
Medium
Large

The layout progressively collapses for tablets and mobile screens.

Active Household Dashboard Data

DashboardService now loads the active household rather than relying on a hardcoded household record.

This preserves the single-household architecture while removing presentation dependence on demo identifiers.

Dashboard monetary values continue to use existing feature services and calculations.

Dashboard Summary

The Dashboard summary now provides:

Responsive metric cards
Clearer financial hierarchy
Shared currency formatting
Token-based spacing
Improved narrow-screen wrapping
Cash-Flow Widget

Cash-flow presentation now uses safe bar magnitudes.

Negative or invalid visual widths are prevented while the original financial values remain unchanged.

Savings Dashboard Widget

The Dashboard Savings widget now uses:

Responsive token-based styling
Shared currency formatting
Accessible progress semantics
Safe zero-to-100-percent visual progress widths
Existing Savings calculations and hooks

No duplicate savings calculation path was introduced.

Savings Page Refresh

The following Savings components were refreshed:

SavingsToolbar
SavingsSummary
SavingsGoalList
SavingsGoalCard

The updated presentation improves:

Goal hierarchy
Financial metric readability
Progress display
Status and priority visibility
Target-date presentation
Required monthly contribution display
Mobile action layout
Responsive card behavior

Savings calculations, account effects, service rules, and persistence behavior remain unchanged.

Shared Currency Formatting

Sprint 12 adds:

frontend/src/shared/utils/formatCurrency.ts

The formatter uses:

Intl.NumberFormat

and accepts an active currency code.

It includes a Philippine peso fallback and replaces repeated hardcoded currency-symbol concatenation in refreshed components.

Stored monetary values and service-layer calculations are not modified.

Accessible Progress Indicators

Refreshed progress indicators now:

Include readable percentage values
Use progress semantics
Cap visual widths between zero and 100 percent
Preserve the true displayed percentage for overfunded goals
Prevent invalid, negative, infinite, or undefined widths
Use semantic design tokens
Updated UI Guidelines

The HFOS UI guidelines were updated to version 1.1.

The document now defines:

Product design principles
Semantic token usage
Scoped CSS standards
Tailwind boundaries
Responsive breakpoints
Application-shell behavior
Shared component rules
Dialog standards
Dashboard standards
Currency formatting
Accessibility requirements
Private-account presentation protections
UI review checklist

The guidelines are stored in:

docs/ui/HFOS_UI_GUIDELINES.md
Removed Obsolete Starter Styles

The following unused Vite starter stylesheets were removed:

frontend/src/App.css
frontend/src/index.css

The active HFOS theme remains the sole global styling entry point.

Architecture

Sprint 12 preserves the existing HFOS architecture:

UI
-> Hook
-> Service
-> Validator
-> Repository
-> Versioned localStorage

The UI refresh does not move financial calculations into presentation components.

The implementation continues to preserve:

Feature-based architecture
Repository abstraction
Service-layer business rules
Controlled form components
OperationResult error handling
Active-household boundaries
Single-household behavior
Private-account ownership
Derived financial values
Versioned localStorage
Existing Reset All Data behavior
Privacy Rules

HFOS remains a strictly single-household application.

Private accounts remain visible and usable only by their owners.

Other household members, including administrators, must not see or use another member's:

Private account name
Private account balance
Private account details
Private account selection option

The UI refresh does not bypass service-layer ownership validation.

Files Added
frontend/src/features/dashboard/widgets/dashboard-summary/DashboardSummary.css
frontend/src/features/dashboard/widgets/savings/SavingsWidget.css
frontend/src/features/savings/components/SavingsGoalCard.css
frontend/src/features/savings/components/SavingsGoalList.css
frontend/src/features/savings/components/SavingsSummary.css
frontend/src/shared/ui/Dialog/Dialog.css
frontend/src/shared/utils/formatCurrency.ts
docs/sprint/Sprint-12.md
docs/releases/RELEASE_NOTES_v0.12.0-alpha.md
Major Files Updated
frontend/src/app/AppShell/AppShell.css
frontend/src/app/AppShell/AppShell.tsx
frontend/src/app/Header/Header.css
frontend/src/app/Header/Header.tsx
frontend/src/app/Sidebar/Sidebar.css
frontend/src/app/Sidebar/Sidebar.tsx
frontend/src/app/Sidebar/SidebarItem.tsx
frontend/src/app/Sidebar/SidebarNav.tsx
frontend/src/features/dashboard/components/DashboardGrid/DashboardGrid.css
frontend/src/features/dashboard/pages/DashboardPage.tsx
frontend/src/features/dashboard/services/DashboardService.ts
frontend/src/features/dashboard/widgets/HouseholdSummary/HouseholdSummary.css
frontend/src/features/dashboard/widgets/NetWorth/NetWorth.tsx
frontend/src/features/dashboard/widgets/cash-flow/CashFlowWidget.css
frontend/src/features/dashboard/widgets/cash-flow/CashFlowWidget.tsx
frontend/src/features/dashboard/widgets/dashboard-summary/DashboardSummary.tsx
frontend/src/features/dashboard/widgets/savings/SavingsWidget.tsx
frontend/src/features/savings/components/SavingsGoalCard.tsx
frontend/src/features/savings/components/SavingsGoalList.tsx
frontend/src/features/savings/components/SavingsSummary.tsx
frontend/src/features/savings/components/SavingsToolbar.tsx
frontend/src/shared/theme/reset.css
frontend/src/shared/ui/Badge/Badge.css
frontend/src/shared/ui/Badge/Badge.tsx
frontend/src/shared/ui/Button/Button.css
frontend/src/shared/ui/Button/Button.tsx
frontend/src/shared/ui/Card/Card.css
frontend/src/shared/ui/Card/Card.tsx
frontend/src/shared/ui/ConfirmDialog/ConfirmDialog.tsx
frontend/src/shared/ui/Dialog/Dialog.tsx
frontend/src/shared/ui/Dialog/DialogBody.tsx
frontend/src/shared/ui/Dialog/DialogFooter.tsx
frontend/src/shared/ui/Dialog/DialogHeader.tsx
frontend/src/shared/ui/PageHeader/PageHeader.css
frontend/src/shared/ui/PageHeader/PageHeader.tsx
frontend/src/shared/ui/StatCard/StatCard.css
frontend/src/shared/ui/StatCard/StatCard.tsx
frontend/src/shared/ui/TimeContext/TimeContext.css
frontend/src/shared/ui/TimeContext/TimeContext.tsx
frontend/src/shared/ui/Widget/Widget.css
frontend/src/shared/ui/Widget/Widget.tsx
frontend/src/styles/theme.css
docs/ui/HFOS_UI_GUIDELINES.md
Files Removed
frontend/src/App.css
frontend/src/index.css
Verification

Sprint 12 was verified using:

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

Desktop Visual Smoke Test: PASS
Tablet Visual Smoke Test: PASS
Mobile Visual Smoke Test: PASS

The final observed production build transformed:

2139 modules

The generated assets included approximately:

CSS: 55.80 kB
CSS gzip: 10.23 kB

JavaScript: 679.63 kB
JavaScript gzip: 174.83 kB

Vite continues to report a non-blocking warning that the main JavaScript bundle exceeds 500 kB after minification.

LF-to-CRLF notices may appear on Windows and are not whitespace errors.

Known Limitations
Bundle Size

The production JavaScript bundle remains above Vite's default 500 kB warning threshold.

Future optimization should include:

Route-level lazy loading
Dynamic imports
Vendor chunk separation
Bundle analysis
Deferred feature loading
Dialog Focus Management

Dialogs now provide improved responsive and semantic presentation.

Complete focus trapping and focus restoration should still be verified or implemented before a public release.

Header Actions

Search, notifications, and profile controls do not yet have final workflows.

Unavailable actions should remain visibly unavailable rather than appearing functional.

Browser-Only Persistence

HFOS continues to use browser localStorage.

There is no:

Cloud database
Cloud backup
Cross-device synchronization
Shared multi-user session
Server-side authorization
No Authentication

HFOS does not yet know which household member is signed in.

Private-account ownership is enforced through workflow context and service validation, but true security requires authenticated identity and server-side authorization.

Full End-to-End Regression

Focused desktop and mobile smoke testing passed.

A full application regression remains recommended for:

Household setup
Accounts
Transactions
Attachments
Shared expenses
Utilities
Settlements
Savings
Persistence after refresh
Reset All Data
Private-account ownership
Inactive account behavior
Mobile feature forms
Next Sprint

Sprint 13 should focus on stabilization and private-alpha readiness.

Recommended scope:

Full end-to-end regression testing
Dialog focus management
Route-level code splitting
User-facing persistence error feedback
Remaining feature-page responsive cleanup
Empty-state standardization
Sample-data controls
Private deployment preparation
Tester instructions
Feedback collection workflow
Critical alpha issue resolution
v0.13.0-alpha documentation
Release Result

Home Finance OS v0.12.0-alpha establishes a reusable and documented UI foundation.

The application now connects:

Semantic design tokens
Shared scoped UI components
Responsive application shell
Mobile off-canvas navigation
Dashboard widget sizing
Active-household presentation
Shared currency formatting
Accessible progress indicators
Savings presentation
Dialog presentation
Privacy-aware UI rules
Desktop and mobile review standards

HFOS retains its existing financial behavior while providing a more consistent, readable, and responsive user experience.
