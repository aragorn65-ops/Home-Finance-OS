import type {
  Transaction,
} from "../../transactions/models/Transaction";
import type {
  RemoteMigrationTransactionUploadPayload,
  RemoteMigrationTransactionUploadRecord,
} from "../models";

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
      transaction.attachments,
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
