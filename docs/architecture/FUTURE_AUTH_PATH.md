# HFOS Future Authentication Path

## Current Boundary

HFOS v0.20.0-alpha uses local browser privacy controls, not account authentication.

The local app lock protects casual access on the current browser by asking for a PIN after refresh, manual lock, or inactivity. It does not prove a cloud identity, protect data outside this browser profile, or authorize shared household roles.

Password-protected backups encrypt a backup file before it leaves the browser. They do not create an HFOS account, recover forgotten passwords, or sync data across devices.

## Future Auth Goals

Future full authentication should introduce:

* Account identity through a backend auth provider.
* Household membership tied to authenticated users.
* Explicit roles and permissions for household data.
* Server-side access checks for every shared record.
* Device/session management independent of local app lock.
* Recovery flows that do not expose household financial data.

## Required Architecture Before Build

Before adding backend login, HFOS needs decisions for:

* Identity provider and session model.
* Household invitation and ownership rules.
* Record-level tenant isolation.
* Sync conflict behavior between local and remote data.
* Backup import ownership checks.
* Migration from local-first storage to authenticated storage.

## Non-Goals For Local App Lock

Local app lock must not be described as:

* Cloud login.
* Multi-user authorization.
* Protection from local browser developer tools.
* Recovery for forgotten backup passwords.
* A replacement for encrypted device storage.

## Compatibility Rule

Local-first HFOS must remain usable without Google Drive or account login until the full auth model is deliberately designed and migrated.
