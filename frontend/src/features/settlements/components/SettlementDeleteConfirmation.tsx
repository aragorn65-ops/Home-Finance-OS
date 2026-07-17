import type { Settlement } from "../models/Settlement";
import formatCurrency from "../../../shared/utils/formatCurrency";

type SettlementDeleteConfirmationProps = {
  settlement: Settlement;

  fromMemberName: string;
  toMemberName: string;

  isDeleting?: boolean;
  errorMessage?: string;
  currency?: string;

  onConfirm: (
    settlement: Settlement
  ) => void;

  onCancel: () => void;
};

function getApplicationMethodLabel(
  method:
    Settlement["applicationMethod"]
): string {
  if (method === "manual") {
    return "Manual";
  }

  return "Oldest First";
}

export default function SettlementDeleteConfirmation({
  settlement,

  fromMemberName,
  toMemberName,

  isDeleting = false,
  errorMessage,
  currency,

  onConfirm,
  onCancel,
}: SettlementDeleteConfirmationProps) {
  const formattedAmount =
    formatCurrency(
      settlement.amount,
      currency
    );

  const applicationMethodLabel =
    getApplicationMethodLabel(
      settlement.applicationMethod
    );

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-settlement-title"
      aria-describedby="delete-settlement-description"
      className="space-y-5 rounded-lg border bg-white p-6"
    >
      <div>
        <h2
          id="delete-settlement-title"
          className="text-xl font-semibold text-foreground"
        >
          Delete Settlement
        </h2>

        <p
          id="delete-settlement-description"
          className="mt-2 text-sm text-muted-foreground"
        >
          This will permanently delete the settlement,
          remove its expense-allocation applications, and
          reverse any linked account balance effects.
        </p>
      </div>

      <div className="rounded-md border bg-muted/40 p-4">
        <p className="font-medium text-foreground">
          {fromMemberName}
          {" → "}
          {toMemberName}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {applicationMethodLabel}
          {" · "}
          Household reimbursement
        </p>

        <p className="mt-3 text-lg font-semibold text-foreground">
          {formattedAmount}
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          {settlement.settlementDate
            .toLocaleDateString()}
        </p>

        {settlement.referenceNumber && (
          <p className="mt-1 text-sm text-muted-foreground">
            Reference:{" "}
            {settlement.referenceNumber}
          </p>
        )}
      </div>

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
          onClick={() =>
            onConfirm(settlement)
          }
          disabled={isDeleting}
          className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeleting
            ? "Deleting..."
            : "Delete Settlement"}
        </button>
      </div>
    </div>
  );
}
