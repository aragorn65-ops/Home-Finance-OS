import type {
  Account,
} from "../../accounts/models/Account";
import type {
  Transaction,
} from "../../transactions/models/Transaction";
import type {
  ExpenseAllocation,
} from "../../transactions/models/ExpenseAllocation";
import createAttachmentMetadataRecords from "../../../shared/utils/createAttachmentMetadataRecords";
import type {
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadRecord,
  RemoteMigrationExpenseAllocationUploadRecord,
  RemoteMigrationTransactionUploadPayload,
  RemoteMigrationTransactionUploadRecord,
} from "../models";

export function createMigrationAccountUploadPayload(
  accounts: Account[],
  localHouseholdId: string
): RemoteMigrationAccountUploadPayload {
  const scopedAccounts =
    accounts.filter(
      (account) =>
        account.householdId ===
        localHouseholdId
    );

  return {
    expectedAccountCount:
      scopedAccounts.length,
    accounts:
      scopedAccounts.map(
        createAccountUploadRecord
      ),
  };
}

export function createMigrationTransactionUploadPayload(
  transactions: Transaction[],
  localHouseholdId: string
): RemoteMigrationTransactionUploadPayload {
  const scopedTransactions =
    transactions.filter(
      (transaction) =>
        transaction.householdId ===
        localHouseholdId
    );

  return {
    expectedTransactionCount:
      scopedTransactions.length,
    transactions:
      scopedTransactions.map(
        createTransactionUploadRecord
      ),
  };
}

export function createMigrationExpenseAllocationUploadRecords(
  allocations: ExpenseAllocation[],
  transactionIds: string[]
): RemoteMigrationExpenseAllocationUploadRecord[] {
  const transactionIdSet =
    new Set(transactionIds);

  return allocations
    .filter((allocation) =>
      transactionIdSet.has(
        allocation.transactionId
      )
    )
    .map(
      createExpenseAllocationUploadRecord
    );
}

function createAccountUploadRecord(
  account: Account
): RemoteMigrationAccountUploadRecord {
  return {
    id:
      account.id,
    visibility:
      account.visibility,
    name:
      account.name,
    institution:
      account.institution,
    accountClass:
      account.accountClass,
    type:
      account.type,
    currency:
      account.currency,
    baseCurrency:
      account.baseCurrency,
    exchangeRate:
      account.exchangeRate,
    exchangeRateEffectiveDate:
      account.exchangeRateEffectiveDate
        ?.toISOString()
        .slice(0, 10),
    exchangeRateSource:
      account.exchangeRateSource,
    exchangeRateProvider:
      account.exchangeRateProvider,
    openingBalance:
      account.openingBalance,
    currentBalance:
      account.currentBalance,
    openingBaseBalance:
      account.openingBaseBalance,
    currentBaseBalance:
      account.currentBaseBalance,
    accountNumber:
      account.accountNumber,
    creditLimit:
      account.creditLimit,
    statementBalance:
      account.statementBalance,
    minimumPayment:
      account.minimumPayment,
    paymentDueDate:
      account.paymentDueDate
        ?.toISOString()
        .slice(0, 10),
    isActive:
      account.isActive,
    createdAt:
      account.createdAt.toISOString(),
    updatedAt:
      account.updatedAt.toISOString(),
  };
}

function createTransactionUploadRecord(
  transaction: Transaction
): RemoteMigrationTransactionUploadRecord {
  return {
    id:
      transaction.id,
    expenseSplitMethod:
      transaction.expenseSplitMethod,
    visibility:
      transaction.visibility,
    type:
      transaction.type,
    amount:
      transaction.amount,
    enteredAmount:
      transaction.enteredAmount,
    enteredCurrency:
      transaction.enteredCurrency,
    baseCurrency:
      transaction.baseCurrency,
    baseAmount:
      transaction.baseAmount,
    exchangeRate:
      transaction.exchangeRate,
    exchangeRateEffectiveDate:
      transaction.exchangeRateEffectiveDate
        ?.toISOString()
        .slice(0, 10),
    exchangeRateSource:
      transaction.exchangeRateSource,
    exchangeRateProvider:
      transaction.exchangeRateProvider,
    sourceAccountId:
      transaction.sourceAccountId,
    destinationAccountId:
      transaction.destinationAccountId,
    category:
      transaction.category,
    description:
      transaction.description,
    notes:
      transaction.notes,
    attachments:
      createAttachmentMetadataRecords(
        transaction.attachments ?? []
      ),
    transactionDate:
      transaction.transactionDate
        .toISOString()
        .slice(0, 10),
    isActive:
      transaction.isActive,
    createdAt:
      transaction.createdAt.toISOString(),
    updatedAt:
      transaction.updatedAt.toISOString(),
  };
}

function createExpenseAllocationUploadRecord(
  allocation: ExpenseAllocation
): RemoteMigrationExpenseAllocationUploadRecord {
  return {
    id:
      allocation.id,
    transactionId:
      allocation.transactionId,
    paidByMemberId:
      allocation.paidByMemberId,
    memberId:
      allocation.memberId,
    isIncluded:
      allocation.isIncluded,
    allocatedAmount:
      allocation.allocatedAmount,
    personalAmount:
      allocation.personalAmount,
    personalItems:
      allocation.personalItems,
    notes:
      allocation.notes,
    createdAt:
      allocation.createdAt.toISOString(),
    updatedAt:
      allocation.updatedAt.toISOString(),
  };
}
