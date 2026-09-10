import AccountRepository from "../../accounts/repositories/AccountRepository";
import SettlementApplicationRepository from "../../settlements/repositories/SettlementApplicationRepository";
import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";
import ExpenseAllocationRepository from "../repositories/ExpenseAllocationRepository";
import TransactionRepository from "../repositories/TransactionRepository";
import TransactionService from "./TransactionService";
import { OperationResults, type OperationResult } from "../../../shared/types/index";

export default async function deleteDuplicateTransaction(
  id: string,
  save: () => Promise<OperationResult<boolean>>
): Promise<OperationResult<boolean>> {
  const transaction = TransactionRepository.findById(id);
  if (!transaction) return OperationResults.failure({ transaction: "Transaction not found." });
  const householdId = transaction.householdId;
  const allocationIds = new Set(ExpenseAllocationRepository.findByTransactionId(id).map((allocation) => allocation.id));
  if (SettlementApplicationRepository.findAll().some((application) => allocationIds.has(application.expenseAllocationId))) {
    return OperationResults.failure({ settlements: "This entry has recorded settlement applications. Duplicate deletion was blocked; reconcile those payments before removing it." });
  }
  const accounts = AccountRepository.findAll().filter((record) => record.householdId === householdId);
  const transactions = TransactionRepository.findAll().filter((record) => record.householdId === householdId);
  const transactionIds = new Set(transactions.map((record) => record.id));
  const allocations = ExpenseAllocationRepository.findAll().filter((record) => transactionIds.has(record.transactionId));
  const bills = UtilityProviderBillRepository.findAll().filter((record) => record.householdId === householdId);
  let committed = false;
  try {
    // Remove the linked bill too, rather than reopening a duplicate as unpaid.
    UtilityProviderBillRepository.replaceForHousehold(householdId, bills.filter((bill) => bill.transactionId !== id));
    const result = TransactionService.delete(id);
    if (!result.success) return result;
    const saved = await save();
    committed = saved.success;
    return saved;
  } catch (error) {
    return OperationResults.failure({ cloud: error instanceof Error ? error.message : "Duplicate deletion could not be saved." });
  } finally {
    if (!committed) {
      AccountRepository.replaceForHousehold(householdId, accounts);
      TransactionRepository.replaceForHousehold(householdId, transactions);
      ExpenseAllocationRepository.replaceForHousehold(householdId, allocations);
      UtilityProviderBillRepository.replaceForHousehold(householdId, bills);
    }
  }
}
