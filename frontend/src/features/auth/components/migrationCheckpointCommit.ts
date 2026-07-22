import type {
  RemoteMigrationDraft,
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
