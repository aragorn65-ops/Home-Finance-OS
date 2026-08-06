import type {
  RemoteMigrationAccountUploadRecord,
  RemoteMigrationExpenseAllocationUploadRecord,
  RemoteMigrationTransactionUploadRecord,
} from "./RemoteMigration";
import type {
  UtilityProviderBill,
} from "../../utilities/models/UtilityProviderBill";

export interface RemoteHouseholdCoreSnapshot {
  householdId: string;
  accounts: RemoteMigrationAccountUploadRecord[];
  transactions: RemoteMigrationTransactionUploadRecord[];
  expenseAllocations?:
    RemoteMigrationExpenseAllocationUploadRecord[];
  providerBills?: UtilityProviderBill[];
  savedAt?: Date;
}

export interface RemoteHouseholdCoreSnapshotInput {
  householdId: string;
  accounts: RemoteMigrationAccountUploadRecord[];
  transactions: RemoteMigrationTransactionUploadRecord[];
  expenseAllocations:
    RemoteMigrationExpenseAllocationUploadRecord[];
  providerBills?: UtilityProviderBill[];
}
