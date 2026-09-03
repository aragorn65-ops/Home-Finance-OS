import type { Settlement } from "../models/Settlement";
import formatCurrency from "../../../shared/utils/formatCurrency";
import openAttachmentPreview, {
  hasAttachmentPreviewData,
} from "../../../shared/utils/openAttachmentPreview";

import type { SettlementApplicationDetails } from "../models/SettlementApplicationDetails";

type SettlementDetailsProps = {
  settlement: Settlement;

  fromMemberName: string;
  toMemberName: string;

  sourceAccountName?: string;
  destinationAccountName?: string;
  currency?: string;

  applicationDetails:
    SettlementApplicationDetails[];

  onClose?: () => void;

  onEdit?: (
    settlement: Settlement
  ) => void;
};

function formatAmount(
  amount: number,
  currency?: string
): string {
  return formatCurrency(
    amount,
    currency
  );
}

function formatFileSize(
  sizeBytes: number
): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  return `${(
    sizeBytes / 1024
  ).toFixed(1)} KB`;
}

function getApplicationMethodLabel(
  method:
    Settlement["applicationMethod"]
): string {
  if (method === "manual") {
    return "Manual";
  }

  return "Oldest First";
}

function getPaymentStatusLabel(
  status:
    SettlementApplicationDetails["paymentStatus"]
): string {
  switch (status) {
    case "unpaid":
      return "Unpaid";

    case "partially-paid":
      return "Partially Paid";

    case "paid":
      return "Paid";

    default:
      return "Unpaid";
  }
}

function getPaymentStatusClasses(
  status:
    SettlementApplicationDetails["paymentStatus"]
): string {
  switch (status) {
    case "unpaid":
      return "bg-red-50 text-red-700";

    case "partially-paid":
      return "bg-[#d2c02a] text-amber-700";

    case "paid":
      return "bg-green-50 text-green-700";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function SettlementDetails({
  settlement,

  fromMemberName,
  toMemberName,

  sourceAccountName,
  destinationAccountName,
  currency,

  applicationDetails,

  onClose,
  onEdit,
}: SettlementDetailsProps) {
  const formattedAmount =
    formatAmount(
      settlement.amount,
      currency
    );

  const formattedSettlementDate =
    settlement.settlementDate
      .toLocaleDateString();

  const formattedCreatedAt =
    settlement.createdAt
      .toLocaleString();

  const formattedUpdatedAt =
    settlement.updatedAt
      .toLocaleString();

  const applicationMethodLabel =
    getApplicationMethodLabel(
      settlement.applicationMethod
    );

  const appliedTotal =
    applicationDetails.reduce(
      (
        total,
        application
      ) =>
        total +
        application.appliedAmount,
      0
    );
  const overpaymentAmount =
    Math.max(
      Math.round(
        (
          settlement.amount -
          appliedTotal
        ) * 100
      ) / 100,
      0
    );

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {applicationMethodLabel}
            </span>

            <span
              className={
                settlement.isActive
                  ? "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              }
            >
              {settlement.isActive
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-foreground">
            {fromMemberName}
            {" → "}
            {toMemberName}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Household reimbursement
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">
            Settlement Amount
          </p>

          <p className="text-2xl font-semibold text-foreground">
            {formattedAmount}
          </p>
        </div>
      </div>

      <dl className="grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Paying Member
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {fromMemberName}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Receiving Member
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {toMemberName}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Settlement Date
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {formattedSettlementDate}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Application Method
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {applicationMethodLabel}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Source Account
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {sourceAccountName ??
              "No linked source account"}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Destination Account
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {destinationAccountName ??
              "No linked destination account"}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Reference Number
          </dt>

          <dd className="mt-1 text-sm text-foreground">
            {settlement.referenceNumber ??
              "No reference number"}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-muted-foreground">
            Settlement ID
          </dt>

          <dd className="mt-1 break-all text-sm text-foreground">
            {settlement.id}
          </dd>
        </div>

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

      <section className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">
            Paid Amount
          </p>

          <p className="mt-1 font-semibold text-foreground">
            {formatAmount(
              settlement.amount,
              currency
            )}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">
            Applied to Outstanding
          </p>

          <p className="mt-1 font-semibold text-foreground">
            {formatAmount(
              appliedTotal,
              currency
            )}
          </p>
        </div>

        <div>
          <p className="text-muted-foreground">
            Overpayment Credit
          </p>

          <p className="mt-1 font-semibold text-foreground">
            {formatAmount(
              overpaymentAmount,
              currency
            )}
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">
              Applied Expense Allocations
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Itemized expenses receiving this settlement.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Applied Total
            </p>

            <p className="font-semibold text-foreground">
              {formatAmount(
                appliedTotal,
                currency
              )}
            </p>
          </div>
        </div>

        {applicationDetails.length ===
        0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <h4 className="font-medium text-foreground">
              No application details available
            </h4>

            <p className="mt-1 text-sm text-muted-foreground">
              This settlement is not currently linked to an
              expense allocation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {applicationDetails.map(
              (application) => {
                const statusLabel =
                  getPaymentStatusLabel(
                    application.paymentStatus
                  );

                const statusClasses =
                  getPaymentStatusClasses(
                    application.paymentStatus
                  );

                return (
                  <article
                    key={
                      application
                        .settlementApplicationId
                    }
                    className="rounded-lg border p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-medium text-foreground">
                            {
                              application.description
                            }
                          </h4>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {application.category}
                          {" · "}
                          {application.transactionDate
                            .toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Applied Here
                        </p>

                        <p className="text-lg font-semibold text-foreground">
                          {formatAmount(
                            application.appliedAmount,
                            currency
                          )}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">
                          Original Allocation
                        </dt>

                        <dd className="mt-1 font-medium text-foreground">
                          {formatAmount(
                            application.allocatedAmount,
                            currency
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-muted-foreground">
                          Total Paid
                        </dt>

                        <dd className="mt-1 font-medium text-foreground">
                          {formatAmount(
                            application.paidAmount,
                            currency
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-muted-foreground">
                          Outstanding
                        </dt>

                        <dd className="mt-1 font-medium text-foreground">
                          {formatAmount(
                            application.outstandingAmount,
                            currency
                          )}
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="space-y-4 border-t pt-5">
        <div>
          <h3 className="font-semibold text-foreground">
            Transfer Receipts
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Receipt files attached to this settlement.
          </p>
        </div>

        {settlement.attachments.length ===
        0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <h4 className="font-medium text-foreground">
              No transfer receipts attached
            </h4>
          </div>
        ) : (
          <div className="space-y-3">
            {settlement.attachments.map(
              (attachment) => {
                const hasPreview =
                  hasAttachmentPreviewData(
                    attachment
                  );

                return (
                  <div
                    key={attachment.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {attachment.fileName}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {attachment.category}
                        {" - "}
                        {formatFileSize(
                          attachment.sizeBytes
                        )}
                      </p>
                    </div>

                    {hasPreview ? (
                      <button
                        type="button"
                        onClick={() =>
                          openAttachmentPreview(
                            attachment
                          )
                        }
                        className="rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      >
                        Open
                      </button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Preview unavailable in cloud beta.
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      <div className="border-t pt-5">
        <h3 className="text-sm font-medium text-muted-foreground">
          Notes
        </h3>

        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
          {settlement.notes?.trim() ||
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
              onClick={() =>
                onEdit(settlement)
              }
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Edit Settlement
            </button>
          )}
        </div>
      )}
    </div>
  );
}
