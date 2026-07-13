import type { Transaction } from "../models/Transaction";

type TransactionDetailsProps = {
  transaction: Transaction;
  sourceAccountName?: string;
  destinationAccountName?: string;
  onClose?: () => void;
  onEdit?: (transaction: Transaction) => void;
};

const amountFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getTransactionTypeLabel(
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

export default function TransactionDetails({
  transaction,
  sourceAccountName,
  destinationAccountName,
  onClose,
  onEdit,
}: TransactionDetailsProps) {
  const formattedAmount = amountFormatter.format(
    transaction.amount
  );

  const formattedTransactionDate =
    transaction.transactionDate.toLocaleDateString();

  const formattedCreatedAt =
    transaction.createdAt.toLocaleString();

  const formattedUpdatedAt =
    transaction.updatedAt.toLocaleString();

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {getTransactionTypeLabel(
                transaction.type
              )}
            </span>

            <span
              className={
                transaction.isActive
                  ? "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              }
            >
              {transaction.isActive
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-foreground">
            {transaction.description}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {transaction.category}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">
            Amount
          </p>

          <p className="text-2xl font-semibold text-foreground">
            {formattedAmount}
          </p>
        </div>
      </div>

      <dl className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Transaction Date
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {formattedTransactionDate}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Transaction ID
          </dt>

          <dd className="mt-1 break-all text-sm text-foreground">
            {transaction.id}
          </dd>
        </div>

        {transaction.sourceAccountId && (
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Source Account
            </dt>

            <dd className="mt-1 text-sm text-foreground">
              {sourceAccountName ??
                "Account unavailable"}
            </dd>
          </div>
        )}

        {transaction.destinationAccountId && (
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              Destination Account
            </dt>

            <dd className="mt-1 text-sm text-foreground">
              {destinationAccountName ??
                "Account unavailable"}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Created
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {formattedCreatedAt}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Last Updated
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {formattedUpdatedAt}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Notes
        </h3>

        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
          {transaction.notes.trim() ||
            "No notes provided."}
        </p>
      </div>

      {(onClose || onEdit) && (
        <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Close
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Edit Transaction
            </button>
          )}
        </div>
      )}
    </div>
  );
}