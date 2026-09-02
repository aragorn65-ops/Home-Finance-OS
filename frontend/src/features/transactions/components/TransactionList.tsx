import { EmptyState } from "../../../shared/ui";

import type { Account } from "../../accounts/models/Account";

import type { AllocationPaymentStatus } from "../models/ExpenseAllocation";
import type { Transaction } from "../models/Transaction";

import TransactionListItem from "./TransactionListItem";

type ProviderPaymentStatus =
  | "paid"
  | "unpaid";

type TransactionListProps = {
  transactions: Transaction[];
  accounts: Account[];
  currency?: string;
  paymentStatusByTransactionId: Record<
    string,
    AllocationPaymentStatus | undefined
  >;
  providerPaymentStatusByTransactionId?: Record<
    string,
    ProviderPaymentStatus | undefined
  >;
  onView?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
};

export default function TransactionList({
  transactions,
  accounts,
  currency,
  paymentStatusByTransactionId,
  providerPaymentStatusByTransactionId = {},
  onView,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const sortedTransactions =
    [...transactions].sort(
      (first, second) => {
        const dateDifference =
          second.transactionDate.getTime() -
          first.transactionDate.getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return (
          second.createdAt.getTime() -
          first.createdAt.getTime()
        );
      }
    );

  const getAccountName = (
    accountId: string | null
  ): string | undefined => {
    if (!accountId) {
      return undefined;
    }

    return accounts.find(
      (account) => account.id === accountId
    )?.name;
  };

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        message="Add income, expenses, or transfers to begin building the household ledger."
      />
    );
  }

  return (
    <div className="space-y-3">
      {sortedTransactions.map((transaction) => (
        <TransactionListItem
          key={transaction.id}
          transaction={transaction}
          paymentStatus={
            paymentStatusByTransactionId[
              transaction.id
            ]
          }
          providerPaymentStatus={
            providerPaymentStatusByTransactionId[
              transaction.id
            ]
          }
          currency={currency}
          sourceAccountName={getAccountName(
            transaction.sourceAccountId
          )}
          destinationAccountName={getAccountName(
            transaction.destinationAccountId
          )}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
