import type { Transaction } from "../models/Transaction";

type TransactionListItemProps = {
  transaction: Transaction;
  sourceAccountName?: string;
  destinationAccountName?: string;
  onView?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
};

const amountFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
      : "Source account unavailable";
  }

  if (sourceAccountName && destinationAccountName) {
    return `${sourceAccountName} → ${destinationAccountName}`;
  }

  return "Transfer accounts unavailable";
}

export default function TransactionListItem({
  transaction,
  sourceAccountName,
  destinationAccountName,
  onView,
  onEdit,
  onDelete,
}: TransactionListItemProps) {
  const formattedDate =
    transaction.transactionDate.toLocaleDateString();

  const formattedAmount = amountFormatter.format(
    transaction.amount
  );

  const accountSummary = getAccountSummary(
    transaction,
    sourceAccountName,
    destinationAccountName
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
            {getTypeLabel(transaction.type)}
          </span>

          <span className="text-sm text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        <h3 className="truncate font-semibold text-foreground">
          {transaction.description}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {transaction.category} · {accountSummary}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <span className="min-w-28 text-right text-lg font-semibold text-foreground">
          {formattedAmount}
        </span>

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