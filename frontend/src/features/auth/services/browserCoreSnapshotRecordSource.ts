import AccountService from "../../accounts/services/AccountService";
import TransactionService from "../../transactions/services/TransactionService";

import type {
  CoreSnapshotRecordSource,
} from "./coreSnapshotSync";

export const browserCoreSnapshotRecordSource:
  CoreSnapshotRecordSource = {
  getAccounts() {
    return AccountService.getAccounts();
  },
  getTransactions() {
    return TransactionService
      .getTransactions();
  },
};
