import AccountRepository from "../../accounts/repositories/AccountRepository";
import TransactionRepository from "../../transactions/repositories/TransactionRepository";
import ExpenseAllocationRepository from "../../transactions/repositories/ExpenseAllocationRepository";
import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";

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

  replaceExpenseAllocations(
    householdId,
    allocations
  ) {
    return ExpenseAllocationRepository
      .replaceForHousehold(
        householdId,
        allocations
      );
  },

  replaceProviderBills(
    householdId,
    providerBills
  ) {
    return UtilityProviderBillRepository
      .replaceForHousehold(
        householdId,
        providerBills
      );
  },
};
