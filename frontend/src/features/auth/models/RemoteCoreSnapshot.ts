import type {
  RemoteMigrationAccountUploadRecord,
  RemoteMigrationTransactionUploadRecord,
} from "./RemoteMigration";

export interface RemoteHouseholdCoreSnapshot {
  householdId: string;
  accounts: RemoteMigrationAccountUploadRecord[];
  transactions: RemoteMigrationTransactionUploadRecord[];
  savedAt?: Date;
}

export interface RemoteHouseholdCoreSnapshotInput {
  householdId: string;
  accounts: RemoteMigrationAccountUploadRecord[];
  transactions: RemoteMigrationTransactionUploadRecord[];
}
