# ADR-0002: Application Routing Architecture

## Status

Accepted

---

## Date

2026-07-11

---

## Context

HFOS now includes:

- Startup
- Household Onboarding
- Main Application

The application needed a routing structure that keeps onboarding separate from the primary application experience while remaining scalable for future modules.

---

## Decision

The application is divided into three routing areas.

```
/
├── Startup
├── /household
└── /app
      ├── Dashboard
      ├── Help Center
      ├── Settings
      ├── Expenses
      ├── Savings
      ├── Reports
      └── About
```

`AppShell` only wraps routes under `/app`.

The Household Wizard intentionally operates outside the application shell to provide a distraction-free onboarding experience.

---

## Rationale

This architecture:

- separates onboarding from normal application usage
- simplifies future authentication
- keeps routing scalable
- supports future multi-step workflows
- reduces coupling between startup logic and the main application

---

## Consequences

### Positive

- Cleaner routing
- Better user experience
- Easier maintenance
- Better scalability

### Negative

- Requires nested routing
- StartupPage becomes the application entry point

---

## Alternatives Considered

### Option A

Everything inside AppShell.

Rejected because onboarding should not display the full application navigation.

### Option B

Dashboard as the root page.

Rejected because new users should immediately enter the setup wizard.

---

## Related ADRs

ADR-0001 — Feature-Based Architecture
ADR-0002 — Application Routing Architecture

---

## Approved By

Founder