# HFOS Project Context

**Project:** Home Finance OS (HFOS)

**Current Version:** v0.6.0-alpha

**Status:** Active Development

---

# Vision

Home Finance OS (HFOS) is a modern household financial management platform built around transparency, governance, and long-term maintainability.

HFOS is designed to become the central operating system for managing personal and household finances through clear financial visibility, intelligent automation, and modular architecture.

Project Motto:

> Financial Clarity Through Transparency

---

# Long-Term Modules

Core Modules

- Household
- Accounts
- Transactions
- Categories
- Budgets
- Assets
- Liabilities
- Goals
- Reports
- Dashboard
- Analytics
- AI Insights

Supporting Modules

- Governance
- Settings
- Notifications
- User Preferences

---

# Technology Stack

Frontend

- React
- TypeScript
- Vite

Architecture

- Feature-based Architecture
- Repository Pattern
- Service Layer
- Shared UI Library
- Dashboard Widget Architecture
- OperationResult Pattern

Future

- REST API
- PostgreSQL
- Authentication
- Cloud Deployment

---

# Repository Structure

```
frontend/
    src/
        app/

        features/
            accounts/
            dashboard/
            governance/
            household/
            transactions/
            categories/
            budgets/
            assets/
            liabilities/
            goals/

        shared/
            ui/
            hooks/
            types/
            utils/

docs/
    architecture/
    api/
    blueprint/
    business_rules/
    constitution/
    database/
    decisions/
    meeting_notes/
    project/
    releases/
    sprint/
```

---

# Architectural Principles

HFOS follows:

- SOLID Principles
- Separation of Concerns
- Feature Isolation
- Clean Architecture
- Reusable Components
- Composition over Inheritance

Business logic belongs inside Services.

Persistence belongs inside Repositories.

UI components remain presentation-only.

---

# Layer Responsibilities

UI

Responsible for:

- Rendering
- User interaction
- Input collection

Must not contain business logic.

---

Hooks

Responsible for:

- Local UI state
- Feature orchestration

---

Services

Responsible for:

- Business rules
- Validation
- Calculations
- Workflow coordination

---

Repositories

Responsible for:

- Data access
- CRUD operations
- Persistence abstraction

---

Validators

Responsible for:

- Validation rules
- User input verification

---

Shared UI

Reusable components only.

Examples

- Button
- Card
- Input
- Select
- Badge
- StatusBadge
- Dialog
- ConfirmDialog
- Widget
- StatCard
- EmptyState
- PageHeader

---

# Coding Standards

Always use:

- TypeScript strict mode
- import type where appropriate
- Named interfaces
- Small focused components
- Single responsibility

Avoid:

- Hardcoded business rules
- Duplicate logic
- Large components
- Deep prop drilling

---

# Development Workflow

For every implementation task, respond using this structure:

## Goal

## Reason for Change

## Architecture Impact

## Location

## File

## Complete Script

Always provide complete files unless partial changes are explicitly requested.

---

# Working Agreement

- One task at a time.
- Wait until the user replies "done".
- Keep explanations concise.
- Prefer implementation over theory.
- Preserve existing architecture.
- Minimize breaking changes.
- Reserve sprint summaries for milestone completion.

---

# Git Workflow

Feature work

```
git add .
git commit -m "<type>: <description>"
git push
```

Release

```
git tag -a <version> -m "<version>"
git push origin <version>
```

---

# Versioning

Semantic Versioning

```
major.minor.patch-stage
```

Examples

- v0.6.0-alpha
- v0.7.0-beta
- v1.0.0

---

# Documentation Standards

Repository Root

- README.md
- CHANGELOG.md
- LICENSE

docs/

- architecture/
- api/
- blueprint/
- business_rules/
- constitution/
- database/
- decisions/
- meeting_notes/
- project/
- releases/
- sprint/

---

# Completed Sprints

Sprint 1

- Foundation
- Project setup
- Routing

Sprint 2

- Household Wizard

Sprint 3

- Governance Module

Sprint 4

- Dashboard Framework

Sprint 5

- Dashboard Architecture

Sprint 6

- Accounts Module
- Dashboard Integration
- Production Build
- v0.6.0-alpha

---

# Current Status

Completed

- Governance
- Household
- Dashboard
- Accounts

Production Build

- TypeScript: PASS
- Vite Production Build: PASS

---

# Next Priority

Sprint 7

Primary objective:

Build the Transactions Module.

Deliver:

- Transaction CRUD
- Transaction Repository
- Transaction Service
- Validation
- Dashboard Integration

---

# Future Roadmap

Sprint 8

- Categories
- Budgets

Sprint 9

- Assets
- Liabilities

Sprint 10

- Reports
- Analytics

Sprint 11+

- AI Insights
- Automation
- Cloud Sync
- Authentication

---

# Development Philosophy

HFOS values:

- Simplicity over cleverness
- Maintainability over shortcuts
- Reusability over duplication
- Clear architecture over rapid hacks
- Stable releases over unfinished features

Every sprint should leave the project in a releasable state with a successful production build.