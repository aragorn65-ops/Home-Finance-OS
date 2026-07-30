import AccountRepository from "../../accounts/repositories/AccountRepository";
import TransactionRepository from "../../transactions/repositories/TransactionRepository";

import type {
  CoreSnapshotLocalWriter,
} from "./coreSnapshotSync";

export const browserCoreSnapshotLocalWriter:
  CoreSnapshotLocalWriter = {
  replaceAccounts(
    householdId,
    accounts
  ) {
    return AccountRepository
      .replaceForHousehold(
        householdId,
        accounts
      );
  },

  replaceTransactions(
    householdId,
    transactions
  ) {
    return TransactionRepository
      .replaceForHousehold(
        householdId,
        transactions
      );
  },
};
