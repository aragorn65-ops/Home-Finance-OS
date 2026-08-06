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
    const remoteAccountIds =
      new Set(
        accounts.map(
          (account) => account.id
        )
      );
    const localPersonalAccounts =
      AccountRepository
        .findAll()
        .filter(
          (account) =>
            account.householdId ===
              householdId &&
            account.visibility ===
              "private" &&
            !remoteAccountIds.has(
              account.id
            )
        );

    return AccountRepository
      .replaceForHousehold(
        householdId,
        [
          ...accounts,
          ...localPersonalAccounts,
        ]
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
