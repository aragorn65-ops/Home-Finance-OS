import type { Account } from "../../accounts/models/Account";

import type { AllocationPaymentStatus } from "../models/ExpenseAllocation";
import type { Transaction } from "../models/Transaction";

import TransactionListItem from "./TransactionListItem";

type TransactionListProps = {
  transactions: Transaction[];
  accounts: Account[];
  paymentStatusByTransactionId: Record<
    string,
    AllocationPaymentStatus | undefined
  >;
  onView?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
};

export default function TransactionList({
  transactions,
  accounts,
  paymentStatusByTransactionId,
  onView,
  onEdit,
  onDelete,
}: TransactionListProps) {
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
      <div className="rounded-lg border border-dashed bg-white p-8 text-center">
        <h3 className="font-semibold text-foreground">
          No transactions yet
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Add your first income, expense, or transfer
          transaction.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <TransactionListItem
          key={transaction.id}
          transaction={transaction}
          paymentStatus={
            paymentStatusByTransactionId[
              transaction.id
            ]
          }
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