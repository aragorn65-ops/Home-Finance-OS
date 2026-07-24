import type {
  RemoteMigrationDraft,
} from "../models";

export function requireMigrationValidateDraft(
  drafts: RemoteMigrationDraft[],
  draftId: string
): RemoteMigrationDraft {
  const draft =
    requireMigrationActionDraft(
      drafts,
      draftId
    );

  if (draft.status !== "uploaded") {
    throw new Error(
      "Only uploaded migration checkpoints can be validated."
    );
  }

  return draft;
}

export function requireMigrationAbortDraft(
  drafts: RemoteMigrationDraft[],
  draftId: string
): RemoteMigrationDraft {
  const draft =
    requireMigrationActionDraft(
      drafts,
      draftId
    );

  if (
    draft.status === "committed" ||
    draft.status === "aborted"
  ) {
    throw new Error(
      "Final migration checkpoints cannot be aborted."
    );
  }

  return draft;
}

export function requireMigrationUploadStagingDraft(
  drafts: RemoteMigrationDraft[],
  draftId: string
): RemoteMigrationDraft {
  const draft =
    requireMigrationActionDraft(
      drafts,
      draftId
    );

  if (draft.status !== "validated") {
    throw new Error(
      "Validate the migration checkpoint before staging upload metadata."
    );
  }

  return draft;
}

function requireMigrationActionDraft(
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
      "Migration checkpoint is no longer available locally. Refresh diagnostics before continuing."
    );
  }

  return draft;
}
