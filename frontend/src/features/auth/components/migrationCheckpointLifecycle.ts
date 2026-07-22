import type {
  RemoteMigrationDraft,
} from "../models";

export interface MigrationCheckpointLifecycleEntry {
  label: string;
  value: string;
}

export function getMigrationCheckpointLifecycleEntries(
  draft: RemoteMigrationDraft
): MigrationCheckpointLifecycleEntry[] {
  return [
    {
      label:
        "Validated",
      date:
        draft.validatedAt,
    },
    {
      label:
        "Committed",
      date:
        draft.committedAt,
    },
    {
      label:
        "Aborted",
      date:
        draft.abortedAt,
    },
  ]
    .filter(
      (
        entry
      ): entry is {
        label: string;
        date: Date;
      } => Boolean(entry.date)
    )
    .map((entry) => ({
      label:
        entry.label,
      value:
        formatMigrationCheckpointDate(
          entry.date
        ),
    }));
}

export function sortMigrationCheckpointDrafts(
  drafts: RemoteMigrationDraft[]
): RemoteMigrationDraft[] {
  return [
    ...drafts,
  ].sort((first, second) => {
    const secondTime =
      getMigrationCheckpointSortDate(
        second
      ).getTime();
    const firstTime =
      getMigrationCheckpointSortDate(
        first
      ).getTime();

    if (secondTime !== firstTime) {
      return secondTime - firstTime;
    }

    return first.id.localeCompare(
      second.id
    );
  });
}

export function getMigrationCheckpointSortDate(
  draft: RemoteMigrationDraft
): Date {
  return draft.abortedAt ??
    draft.committedAt ??
    draft.validatedAt ??
    draft.updatedAt;
}

export function formatMigrationCheckpointDate(
  date: Date
): string {
  return date
    .toISOString()
    .replace(
      ".000Z",
      "Z"
    )
    .replace(
      "T",
      " "
    );
}
