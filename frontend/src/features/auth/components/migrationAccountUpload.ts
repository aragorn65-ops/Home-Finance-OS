import type {
  Account,
} from "../../accounts/models/Account";
import type {
  RemoteMigrationAccountUploadPayload,
  RemoteMigrationAccountUploadRecord,
  RemoteMigrationDraft,
} from "../models";

export function createMigrationAccountUploadPayload(
  draft: RemoteMigrationDraft,
  accounts: Account[]
): RemoteMigrationAccountUploadPayload {
  const scopedAccounts =
    accounts.filter(
      (account) =>
        account.householdId ===
        draft.householdId
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
