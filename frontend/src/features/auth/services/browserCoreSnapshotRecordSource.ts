import AccountService from "../../accounts/services/AccountService";
import TransactionService from "../../transactions/services/TransactionService";
import ExpenseAllocationService from "../../transactions/services/ExpenseAllocationService";
import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";

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
  getExpenseAllocations() {
    return ExpenseAllocationService
      .getAllocations();
  },
  getProviderBills() {
    return UtilityProviderBillRepository
      .findAll();
  },
};
