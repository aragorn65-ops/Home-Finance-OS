import type {
  RemoteMigrationDraft,
  RemoteMigrationPreCommitAudit,
} from "../models";
import type {
  MigrationUploadDryRunContract,
} from "./migrationUploadDryRun";

export type MigrationCommitUnlockChecklistStatus =
  | "pass"
  | "blocked"
  | "action-needed"
  | "locked";

export interface MigrationCommitUnlockChecklistItem {
  id: string;
  label: string;
  detail: string;
  status: MigrationCommitUnlockChecklistStatus;
}

export interface MigrationCommitUnlockChecklist {
  isReadyForUnlockReview: boolean;
  items: MigrationCommitUnlockChecklistItem[];
}

export function createMigrationCommitUnlockChecklist(
  draft: RemoteMigrationDraft,
  dryRunContract: MigrationUploadDryRunContract,
  audit?: RemoteMigrationPreCommitAudit
): MigrationCommitUnlockChecklist {
  const items:
    MigrationCommitUnlockChecklistItem[] = [
      createDryRunItem(dryRunContract),
      createUploadManifestItem(
        draft,
        dryRunContract
      ),
      createAccountStagingItem(draft),
      createTransactionStagingItem(draft),
      createPreCommitAuditItem(
        draft,
        audit
      ),
      {
        id: "commit-lock",
        label: "Commit control",
        detail:
          "Commit remains locked until the next explicit unlock sprint.",
        status: "locked",
      },
    ];

  return {
    isReadyForUnlockReview:
      items.every(
        (item) =>
          item.status === "pass" ||
          item.status === "locked"
      ),
    items,
  };
}

function createDryRunItem(
  dryRunContract: MigrationUploadDryRunContract
): MigrationCommitUnlockChecklistItem {
  return {
    id: "dry-run",
    label: "Dry-run contract",
    detail:
      dryRunContract.recordCountsMatch
        ? `${dryRunContract.currentRecordCount} local records match the checkpoint.`
        : dryRunContract.blockers[0] ??
          "Local records do not match the checkpoint.",
    status:
      dryRunContract.recordCountsMatch
        ? "pass"
        : "blocked",
  };
}

function createUploadManifestItem(
  draft: RemoteMigrationDraft,
  dryRunContract: MigrationUploadDryRunContract
): MigrationCommitUnlockChecklistItem {
  const isStaged =
    Boolean(draft.uploadStagedAt) &&
    draft.uploadStagedRecordCount ===
      dryRunContract.currentRecordCount;

  return {
    id: "upload-manifest",
    label: "Upload manifest",
    detail:
      isStaged
        ? `${draft.uploadStagedRecordCount ?? 0} records accounted for.`
        : "Stage the upload manifest before unlock review.",
    status:
      isStaged
        ? "pass"
        : "action-needed",
  };
}

function createAccountStagingItem(
  draft: RemoteMigrationDraft
): MigrationCommitUnlockChecklistItem {
  const expectedCount =
    draft.backupSummary.accountCount ?? 0;
  const isStaged =
    Boolean(draft.accountUploadStagedAt) &&
    draft.accountUploadStagedCount ===
      expectedCount;

  return {
    id: "account-staging",
    label: "Account staging",
    detail:
      isStaged
        ? `${expectedCount} accounts staged.`
        : "Stage accounts before unlock review.",
    status:
      isStaged
        ? "pass"
        : "action-needed",
  };
}

function createTransactionStagingItem(
  draft: RemoteMigrationDraft
): MigrationCommitUnlockChecklistItem {
  const expectedCount =
    draft.backupSummary.transactionCount ?? 0;
  const isStaged =
    Boolean(
      draft.transactionUploadStagedAt
    ) &&
    draft.transactionUploadStagedCount ===
      expectedCount;

  return {
    id: "transaction-staging",
    label: "Transaction staging",
    detail:
      isStaged
        ? `${expectedCount} transactions staged.`
        : "Stage transactions before unlock review.",
    status:
      isStaged
        ? "pass"
        : "action-needed",
  };
}

function createPreCommitAuditItem(
  draft: RemoteMigrationDraft,
  audit:
    | RemoteMigrationPreCommitAudit
    | undefined
): MigrationCommitUnlockChecklistItem {
  if (!audit) {
    return {
      id: "pre-commit-audit",
      label: "Pre-commit audit",
      detail:
        "Run Audit commit after staging transactions.",
      status: "action-needed",
    };
  }

  if (!audit.isReady) {
    return {
      id: "pre-commit-audit",
      label: "Pre-commit audit",
      detail:
        audit.blockers[0] ??
        "Remote staging audit found blockers.",
      status: "blocked",
    };
  }

  const expectedAccountCount =
    draft.backupSummary.accountCount ?? 0;
  const expectedTransactionCount =
    draft.backupSummary.transactionCount ?? 0;
  const countsMatch =
    audit.accountCount ===
      expectedAccountCount &&
    audit.transactionCount ===
      expectedTransactionCount &&
    audit.missingExpenseSourceAccountCount ===
      0 &&
    audit.missingTransactionAccountLinkCount ===
      0;

  return {
    id: "pre-commit-audit",
    label: "Pre-commit audit",
    detail:
      countsMatch
        ? `${audit.accountCount} accounts and ${audit.transactionCount} transactions checked.`
        : "Audit passed but its counts no longer match the local checkpoint.",
    status:
      countsMatch
        ? "pass"
        : "blocked",
  };
}
