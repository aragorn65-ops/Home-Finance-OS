import {
  useMemo,
  useState,
} from "react";

import {
  Dialog,
  DialogBody,
  DialogHeader,
} from "../../../shared/ui";

import {
  OperationResults,
} from "../../../shared/types";
import formatCurrency from "../../../shared/utils/formatCurrency";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";
import {
  formatMonthLabel,
  isSameMonth,
  parseMonthInput,
} from "../../../shared/utils/monthSelection";

import AccountService from "../../accounts/services/AccountService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import MemberBalanceSummary from "../components/MemberBalanceSummary";
import SettlementDeleteConfirmation from "../components/SettlementDeleteConfirmation";
import SettlementDetails from "../components/SettlementDetails";
import SettlementForm from "../components/SettlementForm";
import SettlementList from "../components/SettlementList";
import SettlementToolbar from "../components/SettlementToolbar";
import WhoOwesWhomSummary from "../components/WhoOwesWhomSummary";

import useSettlements from "../hooks/useSettlements";

import SettlementService from "../services/SettlementService";

import SettlementAllocationService from "../services/SettlementAllocationService";

import SettlementApplicationDetailsService from "../services/SettlementApplicationDetailsService";

import type { Settlement } from "../models/Settlement";
import type { SettlementAllocationOption } from "../models/SettlementAllocationOption";
import type { MemberSettlementBalance } from "../models/MemberSettlementBalance";
import type { MemberSettlementObligation } from "../models/MemberSettlementObligation";

import type {
  SettlementForm as SettlementFormData,
} from "../models/SettlementForm";

type SettlementDialogMode =
  | "create"
  | "edit"
  | "view"
  | "delete"
  | null;

function formatDateInput(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapSettlementToForm(
  settlement: Settlement
): SettlementFormData {
  const storedApplications =
    settlement.applicationMethod ===
    "manual"
      ? SettlementService
          .getApplications(
            settlement.id
          )
          .map((application) => ({
            expenseAllocationId:
              application.expenseAllocationId,

            isSelected: true,

            appliedAmount:
              application.appliedAmount,
          }))
      : [];

  return {
    householdId:
      settlement.householdId,

    fromMemberId:
      settlement.fromMemberId,

    toMemberId:
      settlement.toMemberId,

    amount:
      settlement.amount,

    settlementDate:
      formatDateInput(
        settlement.settlementDate
      ),

    sourceAccountId:
      settlement.sourceAccountId ??
      "",

    destinationAccountId:
      settlement.destinationAccountId ??
      "",

    applicationMethod:
      settlement.applicationMethod,

    applications:
      storedApplications,

    referenceNumber:
      settlement.referenceNumber ??
      "",

    notes:
      settlement.notes ?? "",

    isActive:
      settlement.isActive,
  };
}

function roundCurrency(
  amount: number
): number {
  return (
    Math.round(amount * 100) /
    100
  );
}

function createObligationKey(
  fromMemberId: string,
  toMemberId: string
): string {
  return `${fromMemberId}::${toMemberId}`;
}

function deriveObligations(
  allocations: SettlementAllocationOption[]
): MemberSettlementObligation[] {
  const obligations = new Map<
    string,
    MemberSettlementObligation
  >();

  for (const allocation of allocations) {
    if (
      allocation.outstandingAmount <= 0
    ) {
      continue;
    }

    const obligationKey =
      createObligationKey(
        allocation.fromMemberId,
        allocation.toMemberId
      );

    const existing =
      obligations.get(
        obligationKey
      );

    if (existing) {
      obligations.set(
        obligationKey,
        {
          ...existing,

          amount:
            roundCurrency(
              existing.amount +
                allocation.outstandingAmount
            ),

          allocationCount:
            existing.allocationCount + 1,
        }
      );

      continue;
    }

    obligations.set(
      obligationKey,
      {
        fromMemberId:
          allocation.fromMemberId,

        toMemberId:
          allocation.toMemberId,

        amount:
          allocation.outstandingAmount,

        allocationCount: 1,
      }
    );
  }

  return Array.from(
    obligations.values()
  ).sort((first, second) => {
    if (
      first.fromMemberId !==
      second.fromMemberId
    ) {
      return first.fromMemberId.localeCompare(
        second.fromMemberId
      );
    }

    return first.toMemberId.localeCompare(
      second.toMemberId
    );
  });
}

function deriveMemberBalances(
  members: ReturnType<
    typeof HouseholdMemberService.getActiveMembers
  >,
  obligations: MemberSettlementObligation[]
): MemberSettlementBalance[] {
  return members.map((member) => {
    const amountToReceive =
      obligations
        .filter(
          (obligation) =>
            obligation.toMemberId ===
            member.id
        )
        .reduce(
          (total, obligation) =>
            total + obligation.amount,
          0
        );

    const amountToPay =
      obligations
        .filter(
          (obligation) =>
            obligation.fromMemberId ===
            member.id
        )
        .reduce(
          (total, obligation) =>
            total + obligation.amount,
          0
        );

    const roundedAmountToReceive =
      roundCurrency(
        amountToReceive
      );

    const roundedAmountToPay =
      roundCurrency(
        amountToPay
      );

    const netPosition =
      roundCurrency(
        roundedAmountToReceive -
          roundedAmountToPay
      );

    return {
      memberId: member.id,

      amountToReceive:
        roundedAmountToReceive,

      amountToPay:
        roundedAmountToPay,

      netPosition,

      position:
        netPosition > 0
          ? "creditor"
          : netPosition < 0
            ? "debtor"
            : "settled",
    };
  });
}

function totalObligations(
  obligations: MemberSettlementObligation[]
): number {
  return roundCurrency(
    obligations.reduce(
      (total, obligation) =>
        total + obligation.amount,
      0
    )
  );
}

function settlementBelongsToMonth(
  settlement: Settlement,
  selectedMonth: Date
): boolean {
  const applicationDetails =
    SettlementApplicationDetailsService
      .getBySettlementId(
        settlement.id
      );

  if (applicationDetails.length === 0) {
    return isSameMonth(
      settlement.settlementDate,
      selectedMonth
    );
  }

  return applicationDetails.some(
    (details) =>
      isSameMonth(
        details.transactionDate,
        selectedMonth
      )
  );
}

export default function SettlementsPage() {
  const household =
    loadHousehold();

  const householdId =
    household?.id ?? "";

  const currency =
    household?.currency ?? "PHP";

  const {
    settlements,

    create,
    update,
    remove,
  } = useSettlements(
    householdId
  );

  const {
    selectedMonthValue,
    setSelectedMonthValue,
  } = useReportingMonth();

  const selectedMonth =
    parseMonthInput(
      selectedMonthValue
    );

  const selectedMonthLabel =
    formatMonthLabel(
      selectedMonth
    );

  const previousMonthLabel =
    formatMonthLabel(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 1,
        1
      )
    );

  const accounts =
    AccountService
      .getActiveAccounts()
      .filter(
        (account) =>
          account.householdId ===
          householdId
      );

  const members =
    useMemo(
      () =>
        household
          ? HouseholdMemberService
              .getActiveMembers()
              .filter(
                (member) =>
                  member.householdId ===
                  household.id
              )
          : [],
      [household]
    );

  const [
    dialogMode,
    setDialogMode,
  ] = useState<SettlementDialogMode>(
    null
  );

  const [
    selectedSettlement,
    setSelectedSettlement,
  ] = useState<Settlement | null>(
    null
  );

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedSettlement(null);
    setDeleteError("");
  };

  const handleAddSettlement = () => {
    setSelectedSettlement(null);
    setDeleteError("");
    setDialogMode("create");
  };

  const handleViewSettlement = (
    settlement: Settlement
  ) => {
    setSelectedSettlement(
      settlement
    );

    setDeleteError("");
    setDialogMode("view");
  };

  const handleEditSettlement = (
    settlement: Settlement
  ) => {
    setSelectedSettlement(
      settlement
    );

    setDeleteError("");
    setDialogMode("edit");
  };

  const handleDeleteRequest = (
    settlement: Settlement
  ) => {
    setSelectedSettlement(
      settlement
    );

    setDeleteError("");
    setDialogMode("delete");
  };

  const handleSubmitSettlement = (
    form: SettlementFormData
  ) => {
    if (!household) {
      return OperationResults.failure<
        Settlement
      >(
        {
          household:
            "Complete household setup before recording a settlement.",
        },
        "Unable to save the settlement."
      );
    }

    const submissionForm:
      SettlementFormData = {
        ...form,

        householdId:
          household.id,
      };

    const result =
      dialogMode === "edit" &&
      selectedSettlement
        ? update(
            selectedSettlement.id,
            submissionForm
          )
        : create(
            submissionForm
          );

    if (result.success) {
      closeDialog();
    }

    return result;
  };

  const handleDeleteConfirm = (
    settlement: Settlement
  ) => {
    const result =
      remove(
        settlement.id
      );

    if (!result.success) {
      const errors =
        result.errors ?? {};

      const firstError =
        Object.values(
          errors
        )[0];

      setDeleteError(
        result.message ??
          firstError ??
          "Unable to delete the settlement."
      );

      return;
    }

    closeDialog();
  };

  const getMemberName = (
    memberId: string
  ): string => {
    return (
      members.find(
        (member) =>
          member.id === memberId
      )?.displayName ??
      "Unknown Member"
    );
  };

  const getAccountName = (
    accountId?: string
  ): string | undefined => {
    if (!accountId) {
      return undefined;
    }

    return accounts.find(
      (account) =>
        account.id === accountId
    )?.name;
  };

  const outstandingAllocations =
    useMemo(
      () =>
        household
          ? SettlementAllocationService
              .getOutstandingAllocations(
                household.id
              )
          : [],
      [household]
    );

  const currentMonthOutstandingAllocations =
    useMemo(
      () =>
        outstandingAllocations.filter(
          (allocation) =>
            isSameMonth(
              allocation.transactionDate,
              selectedMonth
            )
        ),
      [
        outstandingAllocations,
        selectedMonth,
      ]
    );

  const previousOutstandingAllocations =
    useMemo(
      () =>
        outstandingAllocations.filter(
          (allocation) =>
            allocation.transactionDate <
            selectedMonth
        ),
      [
        outstandingAllocations,
        selectedMonth,
      ]
    );

  const currentMonthObligations =
    useMemo(
      () =>
        deriveObligations(
          currentMonthOutstandingAllocations
        ),
      [currentMonthOutstandingAllocations]
    );

  const previousObligations =
    useMemo(
      () =>
        deriveObligations(
          previousOutstandingAllocations
        ),
      [previousOutstandingAllocations]
    );

  const currentMonthMemberBalances =
    useMemo(
      () =>
        deriveMemberBalances(
          members,
          currentMonthObligations
        ),
      [
        members,
        currentMonthObligations,
      ]
    );

  const totalOutstanding =
    useMemo(
      () =>
        totalObligations(
          currentMonthObligations
        ),
      [currentMonthObligations]
    );

  const previousOutstandingTotal =
    useMemo(
      () =>
        totalObligations(
          previousObligations
        ),
      [previousObligations]
    );

  const monthlySettlements =
    useMemo(
      () =>
        settlements.filter(
          (settlement) =>
            settlementBelongsToMonth(
              settlement,
              selectedMonth
            )
        ),
      [
        settlements,
        selectedMonth,
      ]
    );

  const formAllocationOptions =
    household
      ? dialogMode === "edit" &&
        selectedSettlement
        ? SettlementAllocationService
            .getAllocationsForSettlementEdit(
              household.id,
              selectedSettlement.id
            )
        : outstandingAllocations
      : [];

  const selectedApplicationDetails =
    selectedSettlement
      ? SettlementApplicationDetailsService
          .getBySettlementId(
            selectedSettlement.id
          )
      : [];

  const isFormDialogOpen =
    dialogMode === "create" ||
    dialogMode === "edit";

  return (
    <>
      <SettlementToolbar
        selectedMonth={
          selectedMonthValue
        }
        onSelectedMonthChange={
          setSelectedMonthValue
        }
        onAddSettlement={
          handleAddSettlement
        }
      />

      <div className="space-y-6">
        <section className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Total Outstanding for {selectedMonthLabel}
          </p>

          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(
              totalOutstanding,
              currency
            )}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Unpaid reimbursements from transactions dated
            in {selectedMonthLabel} only.
          </p>
        </section>

        {previousOutstandingTotal > 0 && (
          <section className="rounded-lg border bg-white p-5">
            <p className="text-sm font-medium text-muted-foreground">
              Unsettled Amount From Previous Month (
              {previousMonthLabel})
            </p>

            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(
                previousOutstandingTotal,
                currency
              )}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Carryover from older transaction months.
              Kept separate so {selectedMonthLabel} totals
              stay month-specific.
            </p>
          </section>
        )}

        <MemberBalanceSummary
          balances={
            currentMonthMemberBalances
          }
          members={members}
          allocations={
            currentMonthOutstandingAllocations
          }
          currency={currency}
        />

        <WhoOwesWhomSummary
          obligations={
            currentMonthObligations
          }
          members={members}
          currency={currency}
          title={`Who Owes Whom - ${selectedMonthLabel}`}
          description={`Outstanding reimbursements from ${selectedMonthLabel} transactions only.`}
        />

        {previousObligations.length > 0 && (
          <WhoOwesWhomSummary
            obligations={
              previousObligations
            }
            members={members}
            currency={currency}
            title={`Unsettled Amount From Previous Month (${previousMonthLabel})`}
            description={`Carryover from transaction months before ${selectedMonthLabel}. These amounts are not mixed into the ${selectedMonthLabel} summary.`}
            amountLabel="Carryover"
          />
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Settlement History
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Recorded reimbursements between household
              members.
            </p>
          </div>

          <SettlementList
            settlements={
              monthlySettlements
            }
            members={members}
            accounts={accounts}
            currency={currency}
            onView={
              handleViewSettlement
            }
            onEdit={
              handleEditSettlement
            }
            onDelete={
              handleDeleteRequest
            }
          />
        </section>
      </div>

      <Dialog
        open={isFormDialogOpen}
        onClose={closeDialog}
      >
        <DialogHeader
          title={
            dialogMode === "edit"
              ? "Edit Settlement"
              : "Record Settlement"
          }
        />

        <DialogBody>
          {household ? (
            <SettlementForm
              householdId={
                household.id
              }
              accounts={accounts}
              members={members}
              allocationOptions={
                formAllocationOptions
              }
              currency={currency}
              initialValues={
                dialogMode === "edit" &&
                selectedSettlement
                  ? mapSettlementToForm(
                      selectedSettlement
                    )
                  : undefined
              }
              submitLabel={
                dialogMode === "edit"
                  ? "Update Settlement"
                  : "Record Settlement"
              }
              onSubmit={
                handleSubmitSettlement
              }
              onCancel={
                closeDialog
              }
            />
          ) : (
            <div className="rounded-lg border border-dashed bg-white p-8 text-center">
              <h3 className="font-semibold text-foreground">
                Household setup required
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Complete household setup before recording
                member settlements.
              </p>
            </div>
          )}
        </DialogBody>
      </Dialog>

      <Dialog
        open={
          dialogMode === "view" &&
          selectedSettlement !== null
        }
        onClose={closeDialog}
      >
        <DialogHeader
          title="Settlement Details"
        />

        <DialogBody>
          {selectedSettlement && (
            <SettlementDetails
              settlement={
                selectedSettlement
              }
              fromMemberName={
                getMemberName(
                  selectedSettlement
                    .fromMemberId
                )
              }
              toMemberName={
                getMemberName(
                  selectedSettlement
                    .toMemberId
                )
              }
              sourceAccountName={
                getAccountName(
                  selectedSettlement
                    .sourceAccountId
                )
              }
              destinationAccountName={
                getAccountName(
                  selectedSettlement
                    .destinationAccountId
                )
              }
              applicationDetails={
                selectedApplicationDetails
              }
              currency={currency}
              onClose={
                closeDialog
              }
              onEdit={
                handleEditSettlement
              }
            />
          )}
        </DialogBody>
      </Dialog>

      <Dialog
        open={
          dialogMode === "delete" &&
          selectedSettlement !== null
        }
        onClose={closeDialog}
      >
        <DialogBody>
          {selectedSettlement && (
            <SettlementDeleteConfirmation
              settlement={
                selectedSettlement
              }
              fromMemberName={
                getMemberName(
                  selectedSettlement
                    .fromMemberId
                )
              }
              toMemberName={
                getMemberName(
                  selectedSettlement
                    .toMemberId
                )
              }
              errorMessage={
                deleteError
              }
              currency={currency}
              onConfirm={
                handleDeleteConfirm
              }
              onCancel={
                closeDialog
              }
            />
          )}
        </DialogBody>
      </Dialog>
    </>
  );
}
