# HFOS Backup Ownership And Restore Policy

## Purpose

Sprint 20 made backups safer with optional password protection. Future authenticated HFOS needs additional ownership rules before backups can restore into shared households.

---

## Current Boundary

Current backups are local files. A password-protected backup encrypts file contents, but it does not prove who owns the data or who may restore it into a shared household.

---

## Future Restore Rules

For local-only HFOS:

* Normal and protected backups remain restorable in the browser after preview.
* Protected backups require the backup password before preview or restore.
* HFOS cannot recover forgotten backup passwords.

For authenticated HFOS:

* Restoring into a new household requires a signed-in user who becomes owner.
* Restoring into an existing household requires owner approval.
* Restoring into a shared household must show a summary before remote writes.
* Restoring must not overwrite another household tenant without explicit confirmation.
* Protected backup passwords remain separate from account passwords.

---

## Backup Metadata Needed Later

Future backup versions should consider adding:

* Source household ID.
* Source authenticated household ID when available.
* Exporting user ID when available.
* Exporting member ID when available.
* Backup schema version.
* Record count and checksum summary.
* Whether private records are included.

---

## Non-Goals

* Account recovery from backup password.
* Silent cloud restore.
* Restoring private records into another user's private account.
* Treating Google Drive ownership as HFOS household authorization.
