import type {
  RemoteMigrationAccountUploadRecord,
  RemoteMigrationExpenseAllocationUploadRecord,
  RemoteMigrationTransactionUploadRecord,
} from "./RemoteMigration";

export interface RemoteHouseholdCoreSnapshot {
  householdId: string;
  accounts: RemoteMigrationAccountUploadRecord[];
  transactions: RemoteMigrationTransactionUploadRecord[];
  expenseAllocations:
    RemoteMigrationExpenseAllocationUploadRecord[];
  savedAt?: Date;
}

export interface RemoteHouseholdCoreSnapshotInput {
  householdId: string;
  accounts: RemoteMigrationAccountUploadRecord[];
  transactions: RemoteMigrationTransactionUploadRecord[];
  expenseAllocations:
    RemoteMigrationExpenseAllocationUploadRecord[];
}
