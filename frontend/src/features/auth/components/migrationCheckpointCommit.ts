import type {
  AuthenticatedHouseholdLink,
} from "../../household/services/householdStorage";
import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";
import type {
  RemoteMigrationCommitResult,
  RemoteMigrationDraft,
  RemoteMigrationPreCommitAudit,
} from "../models";

export function requireMigrationCommitDraft(
  drafts: RemoteMigrationDraft[],
  draftId: string
): RemoteMigrationDraft {
  const draft =
    drafts.find(
      (candidate) =>
        candidate.id === draftId
    );

  if (!draft) {
    throw new Error(
      "Migration checkpoint is no longer available locally. Refresh diagnostics before committing."
    );
  }

  if (draft.status !== "validated") {
    throw new Error(
      "Validate the migration checkpoint before committing."
    );
  }

  if (
    !draft.ownerMemberId ||
    !draft.requestedByUserId
  ) {
    throw new Error(
      "Migration checkpoint is missing local link metadata. Refresh diagnostics before committing."
    );
  }

  return draft;
}

export function resolveMigrationCommitLocalOwnerMemberId(
  draft: RemoteMigrationDraft,
  localMembers: HouseholdMember[]
): string {
  if (localMembers.length === 0) {
    throw new Error(
      "Local household members are not available. Refresh diagnostics before committing."
    );
  }

  const matchingRemoteOwner =
    localMembers.find(
      (member) =>
        member.id ===
        draft.ownerMemberId
    );

  if (matchingRemoteOwner) {
    return matchingRemoteOwner.id;
  }

  const localOwner =
    localMembers.find(
      (member) =>
        member.role === "owner" &&
        member.isActive
    ) ??
    localMembers.find(
      (member) =>
        member.role === "owner"
    );

  if (!localOwner) {
    throw new Error(
      "Local household owner is not available. Refresh diagnostics before committing."
    );
  }

  return localOwner.id;
}

export function requireMigrationCommitLocalLink(
  draft: RemoteMigrationDraft,
  link:
    | AuthenticatedHouseholdLink
    | undefined
): void {
  if (!link) {
    return;
  }

  if (
    link.remoteHouseholdId ===
      draft.householdId &&
    link.migrationId === draft.id
  ) {
    return;
  }

  throw new Error(
    "Local household is already linked to a different remote checkpoint. Review the authenticated link before committing."
  );
}

export function requireMigrationCommitUploadStaged(
  draft: RemoteMigrationDraft,
  audit:
    | RemoteMigrationPreCommitAudit
    | undefined
): void {
  if (!draft.uploadStagedAt) {
    throw new Error(
      "Stage the migration upload manifest before committing."
    );
  }

  if (!draft.accountUploadStagedAt) {
    throw new Error(
      "Stage migration accounts before committing."
    );
  }

  if (!draft.transactionUploadStagedAt) {
    throw new Error(
      "Stage migration transactions before committing."
    );
  }

  if (
    draft.uploadStagedRecordCount !==
    draft.remoteRecordCount
  ) {
    throw new Error(
      "Migration upload manifest count does not match the checkpoint."
    );
  }

  if (
    draft.accountUploadStagedCount !==
    (draft.backupSummary.accountCount ?? 0)
  ) {
    throw new Error(
      "Migration account staging count does not match the checkpoint."
    );
  }

  if (
    draft.transactionUploadStagedCount !==
    (draft.backupSummary.transactionCount ?? 0)
  ) {
    throw new Error(
      "Migration transaction staging count does not match the checkpoint."
    );
  }

  if (!audit) {
    throw new Error(
      "Run the pre-commit audit before committing."
    );
  }

  if (!audit.isReady) {
    throw new Error(
      audit.blockers[0] ??
        "Pre-commit audit has blockers."
    );
  }

  if (
    audit.accountCount !==
      (draft.backupSummary.accountCount ?? 0) ||
    audit.transactionCount !==
      (draft.backupSummary.transactionCount ?? 0) ||
    audit.missingExpenseSourceAccountCount !==
      0 ||
    audit.missingTransactionAccountLinkCount !==
      0
  ) {
    throw new Error(
      "Pre-commit audit no longer matches the migration checkpoint."
    );
  }
}

export function assertMigrationCommitResultMatchesDraft(
  draft: RemoteMigrationDraft,
  result: RemoteMigrationCommitResult
): void {
  if (
    result.migrationId !== draft.id ||
    result.householdId !== draft.householdId
  ) {
    throw new Error(
      "Remote persistence committed, but the returned household link does not match the local checkpoint."
    );
  }
}
