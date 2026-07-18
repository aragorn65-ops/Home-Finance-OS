import "./SettlementListItem.css";

import type { Settlement } from "../models/Settlement";
import type { SettlementApplicationDetails } from "../models/SettlementApplicationDetails";
import formatCurrency from "../../../shared/utils/formatCurrency";

type SettlementListItemProps = {
  settlement: Settlement;
  applicationDetails: SettlementApplicationDetails[];

  fromMemberName: string;
  toMemberName: string;

  sourceAccountName?: string;
  destinationAccountName?: string;
  currency?: string;

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
    return `${sourceAccountName} -> ${destinationAccountName}`;
  }

  if (sourceAccountName) {
    return `From ${sourceAccountName}`;
  }

  if (destinationAccountName) {
    return `To ${destinationAccountName}`;
  }

  return "No linked accounts";
}

function getApplicationSettlementLabel(
  application: SettlementApplicationDetails
): string {
  return Math.round(
    application.outstandingAmount * 100
  ) <= 0
    ? "Full"
    : "Partial";
}

export default function SettlementListItem({
  settlement,
  applicationDetails,

  fromMemberName,
  toMemberName,

  sourceAccountName,
  destinationAccountName,
  currency,

  onView,
  onEdit,
  onDelete,
}: SettlementListItemProps) {
  const formattedDate =
    settlement.settlementDate
      .toLocaleDateString();

  const formattedAmount =
    formatCurrency(
      settlement.amount,
      currency
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
    <div className="settlement-history-card grid gap-3 rounded-lg border px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="min-w-0 md:pr-6">
        <div className="mb-1 flex flex-wrap items-center gap-3 text-sm">
          <span className="settlement-history-card__meta font-medium">
            {applicationMethodLabel}
          </span>

          <span className="settlement-history-card__meta">
            {formattedDate}
          </span>
        </div>

        <h3 className="settlement-history-card__title truncate text-base font-semibold">
          {fromMemberName}
          {" -> "}
          {toMemberName}
        </h3>

        <p className="settlement-history-card__text text-sm">
          {accountSummary}
        </p>

        {settlement.referenceNumber && (
          <p className="settlement-history-card__text text-xs">
            Reference:{" "}
            {settlement.referenceNumber}
          </p>
        )}

        {settlement.attachments.length >
          0 && (
          <p className="settlement-history-card__text text-xs">
            Transfer receipts:{" "}
            {settlement.attachments.length}
          </p>
        )}

        <p className="settlement-history-card__label mb-1 mt-2 text-xs font-semibold uppercase leading-tight">
          SETTLED ITEMS
        </p>

        {applicationDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No linked items
          </p>
        ) : (
          <div className="space-y-1.5">
            {applicationDetails
              .slice(0, 3)
              .map((application) => (
                <div
                  key={
                    application
                      .settlementApplicationId
                  }
                  className="grid max-w-sm gap-0.5 text-sm leading-tight"
                >
                  <span className="settlement-history-card__text min-w-0 truncate">
                    {application.description ||
                      application.category}
                  </span>

                  <span className="settlement-history-card__text flex items-center gap-2 whitespace-nowrap pl-0.5">
                    <span className="settlement-history-card__badge rounded-full border px-2 py-0.5 text-xs font-medium leading-none">
                      {getApplicationSettlementLabel(
                        application
                      )}
                    </span>

                    {formatCurrency(
                      application.appliedAmount,
                      currency
                    )}
                  </span>
                </div>
              ))}

            {applicationDetails.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{applicationDetails.length - 3} more
                settled item
                {applicationDetails.length - 3 === 1
                  ? ""
                  : "s"}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
        <span className="settlement-history-card__amount min-w-24 text-left text-lg font-semibold leading-tight md:text-right">
          {formattedAmount}
        </span>

        <div className="flex items-center gap-2">
          {onView && (
            <button
              type="button"
              onClick={() =>
                onView(settlement)
              }
              className="rounded-md px-3 py-1.5 text-sm font-medium"
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
              className="rounded-md px-3 py-1.5 text-sm font-medium"
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
              className="rounded-md px-3 py-1.5 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
