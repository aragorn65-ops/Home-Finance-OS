import type {
  ApplicationBackupSummary,
  ApplicationDataHealthSummary,
} from "../../startup/services/applicationBackup";
import type {
  RemoteMigrationDraft,
} from "../models";

export interface MigrationUploadDryRunCount {
  id: string;
  label: string;
  checkpointCount: number;
  currentCount: number;
  matches: boolean;
}

export interface MigrationUploadDryRunContract {
  draftId: string;
  recordCountsMatch: boolean;
  checkpointRecordCount: number;
  currentRecordCount: number;
  counts: MigrationUploadDryRunCount[];
  blockers: string[];
}

interface CountDefinition {
  id: string;
  label: string;
  checkpointKey?: keyof ApplicationBackupSummary;
  currentKey?: keyof ApplicationDataHealthSummary;
  fixedCount?: number;
}

const countDefinitions:
  CountDefinition[] = [
    {
      id: "household",
      label: "Household",
      fixedCount: 1,
    },
    {
      id: "accounts",
      label: "Accounts",
      checkpointKey: "accountCount",
      currentKey: "accountCount",
    },
    {
      id: "transactions",
      label: "Transactions",
      checkpointKey: "transactionCount",
      currentKey: "transactionCount",
    },
    {
      id: "expense-allocations",
      label: "Expense allocations",
      checkpointKey: "expenseAllocationCount",
      currentKey: "expenseAllocationCount",
    },
    {
      id: "settlements",
      label: "Settlements",
      checkpointKey: "settlementCount",
      currentKey: "settlementCount",
    },
    {
      id: "settlement-applications",
      label: "Settlement applications",
      checkpointKey: "settlementApplicationCount",
      currentKey: "settlementApplicationCount",
    },
    {
      id: "savings-goals",
      label: "Savings goals",
      checkpointKey: "savingsGoalCount",
      currentKey: "savingsGoalCount",
    },
    {
      id: "savings-activities",
      label: "Savings activities",
      checkpointKey: "savingsActivityCount",
      currentKey: "savingsActivityCount",
    },
    {
      id: "provider-bills",
      label: "Provider bills",
      checkpointKey: "providerBillCount",
      currentKey: "providerBillCount",
    },
  ];

export function createMigrationUploadDryRunContract(
  draft: RemoteMigrationDraft,
  currentSummary: ApplicationDataHealthSummary
): MigrationUploadDryRunContract {
  const counts =
    countDefinitions.map(
      (definition) =>
        createDryRunCount(
          definition,
          draft.backupSummary,
          currentSummary
        )
    );
  const checkpointRecordCount =
    sumCounts(
      counts.map(
        (count) =>
          count.checkpointCount
      )
    );
  const currentRecordCount =
    sumCounts(
      counts.map(
        (count) =>
          count.currentCount
      )
    );
  const mismatches =
    counts.filter(
      (count) =>
        !count.matches
    );
  const blockers =
    mismatches.map(
      (count) =>
        `${count.label} changed from ${count.checkpointCount} to ${count.currentCount}.`
    );

  if (
    draft.remoteRecordCount !==
    checkpointRecordCount
  ) {
    blockers.push(
      `Checkpoint staged ${draft.remoteRecordCount} records, but its backup summary contains ${checkpointRecordCount}.`
    );
  }

  return {
    draftId:
      draft.id,
    recordCountsMatch:
      blockers.length === 0,
    checkpointRecordCount,
    currentRecordCount,
    counts,
    blockers,
  };
}

function createDryRunCount(
  definition: CountDefinition,
  checkpointSummary: ApplicationBackupSummary,
  currentSummary: ApplicationDataHealthSummary
): MigrationUploadDryRunCount {
  const checkpointCount =
    definition.fixedCount ??
    readNumber(
      checkpointSummary[
        definition.checkpointKey ??
          "accountCount"
      ]
    );
  const currentCount =
    definition.fixedCount ??
    readNumber(
      currentSummary[
        definition.currentKey ??
          "accountCount"
      ]
    );

  return {
    id:
      definition.id,
    label:
      definition.label,
    checkpointCount,
    currentCount,
    matches:
      checkpointCount ===
      currentCount,
  };
}

function readNumber(
  value: unknown
): number {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : 0;
}

function sumCounts(
  values: number[]
): number {
  return values.reduce(
    (total, value) =>
      total + value,
    0
  );
}
