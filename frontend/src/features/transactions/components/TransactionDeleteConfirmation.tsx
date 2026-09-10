import type { Transaction } from "../models/Transaction";
import { useState } from "react";
import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";
import formatCurrency from "../../../shared/utils/formatCurrency";
import {
  normalizeTransactionCategory,
} from "../models/TransactionCategory";

type TransactionDeleteConfirmationProps = {
  transaction: Transaction;
  isDeleting?: boolean;
  errorMessage?: string;
  currency?: string;
  onConfirm: (
    transaction: Transaction,
    deleteLinkedBill?: boolean
  ) => void | Promise<void>;
  onCancel: () => void;
};

function getTransactionTypeLabel(
  type: Transaction["type"]
): string {
  switch (type) {
    case "income":
      return "income";

    case "expense":
      return "expense";

    case "transfer":
      return "transfer";

    default:
      return "transaction";
  }
}

export default function TransactionDeleteConfirmation({
  transaction,
  isDeleting = false,
  errorMessage,
  currency,
  onConfirm,
  onCancel,
}: TransactionDeleteConfirmationProps) {
  const [deleteLinkedBill, setDeleteLinkedBill] = useState(false);
  const linkedBills = UtilityProviderBillRepository.findAll().filter(
    (bill) => bill.householdId === transaction.householdId && bill.transactionId === transaction.id
  );
  const transactionType = getTransactionTypeLabel(
    transaction.type
  );

  const formattedAmount = formatCurrency(
    transaction.amount,
    currency
  );

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-transaction-title"
      aria-describedby="delete-transaction-description"
      className="space-y-5 rounded-lg border bg-white p-6"
    >
      <div>
        <h2
          id="delete-transaction-title"
          className="text-xl font-semibold text-foreground"
        >
          Delete Transaction
        </h2>

        <p
          id="delete-transaction-description"
          className="mt-2 text-sm text-muted-foreground"
        >
          This will permanently delete the transaction and
          reverse its effect on the related account balances.
        </p>
      </div>

      <div className="rounded-md border bg-muted/40 p-4">
        <p className="font-medium text-foreground">
          {transaction.description}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {normalizeTransactionCategory(
            transaction.category
          )} · {transactionType}
        </p>

        <p className="mt-3 text-lg font-semibold text-foreground">
          {formattedAmount}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {transaction.transactionDate.toLocaleDateString()}
        </p>
      </div>

      {linkedBills.length > 0 && (
        <div className="space-y-2">
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={deleteLinkedBill} disabled={isDeleting}
              onChange={(event) => setDeleteLinkedBill(event.target.checked)} />
            Delete linked provider bill too (duplicate entry)
          </label>
          <p className="text-sm text-muted-foreground">
            {linkedBills.map((bill) => bill.providerName).join(", ")}
            {deleteLinkedBill
              ? ": the linked bill, its attachments, and this transaction's expense shares will be removed. Other entries are retained. Recorded settlement links block deletion."
              : ": the provider bill is retained when removing only its payment transaction."}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="rounded-md border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => {
            void onConfirm(
              transaction,
              deleteLinkedBill
            );
          }}
          disabled={isDeleting}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting
            ? "Deleting..."
            : "Delete Transaction"}
        </button>
      </div>
    </div>
  );
}
