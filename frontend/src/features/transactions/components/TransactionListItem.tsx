import type { Transaction } from "../models/Transaction";
import formatCurrency from "../../../shared/utils/formatCurrency";
import {
  normalizeTransactionCategory,
} from "../models/TransactionCategory";

import type { AllocationPaymentStatus } from "../models/ExpenseAllocation";

type ProviderPaymentStatus =
  | "paid"
  | "unpaid";

type TransactionListItemProps = {
  transaction: Transaction;
  paymentStatus?: AllocationPaymentStatus;
  providerPaymentStatus?: ProviderPaymentStatus;
  sourceAccountName?: string;
  destinationAccountName?: string;
  currency?: string;
  onView?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
};

function getTypeLabel(
  type: Transaction["type"]
): string {
  switch (type) {
    case "income":
      return "Income";

    case "expense":
      return "Expense";

    case "transfer":
      return "Transfer";

    default:
      return "Transaction";
  }
}

function getPaymentStatusLabel(
  status:
    | AllocationPaymentStatus
    | ProviderPaymentStatus
): string {
  switch (status) {
    case "partially-paid":
      return "Partially Paid";

    case "paid":
      return "Paid";

    case "unpaid":
    default:
      return "Unpaid";
  }
}

function getPaymentStatusClasses(
  status:
    | AllocationPaymentStatus
    | ProviderPaymentStatus
): string {
  switch (status) {
    case "paid":
      return "bg-green-50 text-green-700";

    case "partially-paid":
      return "bg-[#d2c02a] text-amber-700";

    case "unpaid":
    default:
      return "bg-red-50 text-red-700";
  }
}

function getAccountSummary(
  transaction: Transaction,
  sourceAccountName?: string,
  destinationAccountName?: string
): string {
  if (transaction.type === "income") {
    return destinationAccountName
      ? `To ${destinationAccountName}`
      : "Destination account unavailable";
  }

  if (transaction.type === "expense") {
    return sourceAccountName
      ? `From ${sourceAccountName}`
      : "From Cash";
  }

  if (sourceAccountName && destinationAccountName) {
    return `${sourceAccountName} → ${destinationAccountName}`;
  }

  return "Transfer accounts unavailable";
}

export default function TransactionListItem({
  transaction,
  paymentStatus,
  providerPaymentStatus,
  sourceAccountName,
  destinationAccountName,
  currency,
  onView,
  onEdit,
  onDelete,
}: TransactionListItemProps) {
  const formattedDate =
    transaction.transactionDate.toLocaleDateString();

  const formattedAmount = formatCurrency(
    transaction.amount,
    currency
  );

  const showEnteredIncome =
    transaction.type === "income" &&
    transaction.enteredCurrency &&
    transaction.enteredCurrency !==
      (
        transaction.baseCurrency ??
        currency
      );

  const accountSummary = getAccountSummary(
    transaction,
    sourceAccountName,
    destinationAccountName
  );
  const visiblePaymentStatus =
    providerPaymentStatus ??
    paymentStatus;

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
            {getTypeLabel(transaction.type)}
          </span>

          {visiblePaymentStatus && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusClasses(
                visiblePaymentStatus
              )}`}
            >
              {getPaymentStatusLabel(
                visiblePaymentStatus
              )}
            </span>
          )}

          <span className="text-sm text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        <h3 className="truncate font-semibold text-foreground">
          {transaction.description}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {normalizeTransactionCategory(
            transaction.category
          )} · {accountSummary}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <span className="min-w-28 text-right text-lg font-semibold text-foreground">
          {formattedAmount}
        </span>

        {showEnteredIncome && (
          <span className="text-right text-xs text-muted-foreground">
            {formatCurrency(
              transaction.enteredAmount ??
                transaction.amount,
              transaction.enteredCurrency
            )}{" "}
            entered
          </span>
        )}

        <div className="flex items-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={() => onView(transaction)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              View
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              className="rounded-md border px-3 py-1.5 text-sm text-destructive hover:bg-muted"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
