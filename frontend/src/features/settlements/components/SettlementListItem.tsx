import type { Settlement } from "../models/Settlement";

type SettlementListItemProps = {
  settlement: Settlement;

  fromMemberName: string;
  toMemberName: string;

  sourceAccountName?: string;
  destinationAccountName?: string;

  onView?: (
    settlement: Settlement
  ) => void;

  onEdit?: (
    settlement: Settlement
  ) => void;

  onDelete?: (
    settlement: Settlement
  ) => void;
};

const amountFormatter =
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function getApplicationMethodLabel(
  method:
    Settlement["applicationMethod"]
): string {
  if (method === "manual") {
    return "Manual";
  }

  return "Oldest First";
}

function getAccountSummary(
  sourceAccountName?: string,
  destinationAccountName?: string
): string {
  if (
    sourceAccountName &&
    destinationAccountName
  ) {
    return (
      `${sourceAccountName} → ` +
      destinationAccountName
    );
  }

  if (sourceAccountName) {
    return `From ${sourceAccountName}`;
  }

  if (destinationAccountName) {
    return `To ${destinationAccountName}`;
  }

  return "No linked accounts";
}

export default function SettlementListItem({
  settlement,

  fromMemberName,
  toMemberName,

  sourceAccountName,
  destinationAccountName,

  onView,
  onEdit,
  onDelete,
}: SettlementListItemProps) {
  const formattedDate =
    settlement.settlementDate
      .toLocaleDateString();

  const formattedAmount =
    amountFormatter.format(
      settlement.amount
    );

  const applicationMethodLabel =
    getApplicationMethodLabel(
      settlement.applicationMethod
    );

  const accountSummary =
    getAccountSummary(
      sourceAccountName,
      destinationAccountName
    );

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {applicationMethodLabel}
          </span>

          <span className="text-sm text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        <h3 className="truncate font-semibold text-foreground">
          {fromMemberName}
          {" → "}
          {toMemberName}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {accountSummary}
        </p>

        {settlement.referenceNumber && (
          <p className="mt-1 text-xs text-muted-foreground">
            Reference:{" "}
            {settlement.referenceNumber}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <span className="min-w-28 text-right text-lg font-semibold text-foreground">
          {formattedAmount}
        </span>

        <div className="flex items-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={() =>
                onView(settlement)
              }
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              View
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() =>
                onEdit(settlement)
              }
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() =>
                onDelete(settlement)
              }
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