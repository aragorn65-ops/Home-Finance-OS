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
} from "../../../shared/types/index";
import formatCurrency from "../../../shared/utils/formatCurrency";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";
import {
  formatMonthLabel,
  isSameMonth,
  parseMonthInput,
} from "../../../shared/utils/monthSelection";

import AccountService from "../../accounts/services/AccountService";

import {
  useHouseholdMembership,
} from "../../auth/hooks";
import type {
  HouseholdMembership,
} from "../../auth/models";
import {
  canAccessSettlementRecord,
  type AuthorizationContext,
} from "../../auth/services";

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

    attachments:
      settlement.attachments.map(
        (attachment) => ({
          ...attachment,
          createdAt: new Date(
            attachment.createdAt
          ),
        })
      ),

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

function resolveCloudMemberId(
  memberId: string,
  household:
    | ReturnType<typeof loadHousehold>
    | null,
  membership:
    | HouseholdMembership
    | undefined
): string {
  const localOwnerMemberId =
    household?.authenticatedLink
      ?.ownerMemberId;

  if (
    localOwnerMemberId &&
    memberId === localOwnerMemberId &&
    membership?.memberId
  ) {
    return membership.memberId;
  }

  return memberId;
}

function createCloudSettlementForm(
  form: SettlementFormData,
  household:
    | ReturnType<typeof loadHousehold>
    | null,
  membership:
    | HouseholdMembership
    | undefined,
  cloudHouseholdId: string
): SettlementFormData {
  const fromMemberId =
    resolveCloudMemberId(
      form.fromMemberId,
      household,
      membership
    );
  const toMemberId =
    resolveCloudMemberId(
      form.toMemberId,
      household,
      membership
    );

  return {
    ...form,
    householdId:
      cloudHouseholdId,
    fromMemberId,
    toMemberId,
    // Public beta cloud sync stores the settlement record first;
    // restored local allocation applications are not cloud-backed yet.
    applicationMethod:
      "oldest-first",
    applications: [],
    sourceAccountId: "",
    destinationAccountId: "",
  };
}

function createCloudSettlementAccessRecord(
  settlement: Settlement,
  household:
    | ReturnType<typeof loadHousehold>
    | null,
  membership:
    | HouseholdMembership
    | undefined,
  cloudHouseholdId: string
): Settlement {
  return {
    ...settlement,
    householdId:
      cloudHouseholdId,
    fromMemberId:
      resolveCloudMemberId(
        settlement.fromMemberId,
        household,
        membership
      ),
    toMemberId:
      resolveCloudMemberId(
        settlement.toMemberId,
        household,
        membership
      ),
  };
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
  const cloudHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    householdId;

  const currency =
    household?.currency ?? "PHP";

  const {
    session,
    membership,
    error:
      membershipError,
  } = useHouseholdMembership(
    cloudHouseholdId
  );

  const effectiveCloudHouseholdId =
    cloudHouseholdId ||
    membership?.householdId ||
    "";

  const shouldEnforceSettlementAuth =
    session.status ===
    "signed-in";
  const canManageSettlementRecords =
    !shouldEnforceSettlementAuth ||
    membership?.role === "owner" ||
    membership?.role === "admin";
  const canRecordSettlement =
    canManageSettlementRecords ||
    membership?.role === "member";

  const localMemberId =
    useMemo(
      () =>
        HouseholdMemberService
          .getActiveMembers()
          .find(
            (member) =>
              member.householdId ===
                householdId &&
              Boolean(
                session.user?.id
              ) &&
              member.userId ===
                session.user?.id
          )?.id ?? "",
      [
        householdId,
        session.user?.id,
      ]
    );
  const authorizedMemberIds =
    useMemo(
      () =>
        [
          membership?.memberId,
          localMemberId,
        ].filter(
          (
            memberId,
            index,
            memberIds
          ): memberId is string =>
            Boolean(memberId) &&
            memberIds.indexOf(memberId) ===
              index
        ),
      [
        localMemberId,
        membership?.memberId,
      ]
    );

  const authorizationContext:
    AuthorizationContext =
    useMemo(
      () => ({
        userId:
          session.user?.id,
        memberId:
          localMemberId ||
          membership?.memberId,
        memberIds:
          authorizedMemberIds,
        membership,
      }),
      [
        authorizedMemberIds,
        localMemberId,
        session.user?.id,
        membership,
      ]
    );

  const {
    settlements,

    create,
    update,
    remove,
    error:
      settlementError,
  } = useSettlements(
    shouldEnforceSettlementAuth
      ? effectiveCloudHouseholdId
      : householdId,
    {
      remoteEnabled:
        shouldEnforceSettlementAuth,
      localHouseholdId:
        householdId,
    }
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
      () => {
        if (household) {
          return HouseholdMemberService
            .getActiveMembers()
            .filter(
              (member) =>
                member.householdId ===
                household.id
            );
        }

        if (!membership) {
          return [];
        }

        return [
          {
            id:
              membership.memberId,
            householdId:
              membership.householdId,
            displayName:
              "You",
            role:
              membership.role ===
              "viewer"
                ? "member"
                : membership.role,
            isActive: true,
            createdAt:
              membership.createdAt,
            updatedAt:
              membership.updatedAt,
          },
        ];
      },
      [
        household,
        membership,
      ]
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

  const [
    isDeletingSettlement,
    setIsDeletingSettlement,
  ] = useState(false);

  const [
    authorizationError,
    setAuthorizationError,
  ] = useState("");

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedSettlement(null);
    setDeleteError("");
    setIsDeletingSettlement(false);
    setAuthorizationError("");
  };

  const handleAddSettlement = () => {
    if (!canRecordSettlement) {
      setAuthorizationError(
        "Only household members can record settlement payments."
      );

      return;
    }

    setSelectedSettlement(null);
    setDeleteError("");
    setAuthorizationError("");
    setDialogMode("create");
  };

  const handleViewSettlement = (
    settlement: Settlement
  ) => {
    const authorizationSettlement =
      shouldEnforceSettlementAuth
        ? createCloudSettlementAccessRecord(
            settlement,
            household,
            membership,
            cloudHouseholdId
          )
        : settlement;

    if (
      shouldEnforceSettlementAuth &&
      !canAccessSettlementRecord(
        authorizationContext,
        authorizationSettlement,
        "view"
      )
    ) {
      setAuthorizationError(
        "You can only view settlement records where you are the payer or receiver."
      );

      return;
    }

    setSelectedSettlement(
      settlement
    );

    setDeleteError("");
    setAuthorizationError("");
    setDialogMode("view");
  };

  const handleEditSettlement = (
    settlement: Settlement
  ) => {
    if (!canRecordSettlement) {
      setAuthorizationError(
        "Only household members can edit settlement records."
      );

      return;
    }

    const authorizationSettlement =
      shouldEnforceSettlementAuth
        ? createCloudSettlementAccessRecord(
            settlement,
            household,
            membership,
            cloudHouseholdId
          )
        : settlement;

    if (
      shouldEnforceSettlementAuth &&
      !canAccessSettlementRecord(
        authorizationContext,
        authorizationSettlement,
        "update"
      )
    ) {
      setAuthorizationError(
        "You can only update settlements where you are the payer or receiver."
      );

      return;
    }

    setSelectedSettlement(
      settlement
    );

    setDeleteError("");
    setAuthorizationError("");
    setDialogMode("edit");
  };

  const handleDeleteRequest = (
    settlement: Settlement
  ) => {
    if (!canManageSettlementRecords) {
      setAuthorizationError(
        "Only a household admin can delete settlement records."
      );

      return;
    }

    const authorizationSettlement =
      shouldEnforceSettlementAuth
        ? createCloudSettlementAccessRecord(
            settlement,
            household,
            membership,
            cloudHouseholdId
          )
        : settlement;

    if (
      shouldEnforceSettlementAuth &&
      !canAccessSettlementRecord(
        authorizationContext,
        authorizationSettlement,
        "delete"
      )
    ) {
      setAuthorizationError(
        "Only a household admin can delete settlement records."
      );

      return;
    }

    setSelectedSettlement(
      settlement
    );

    setDeleteError("");
    setAuthorizationError("");
    setDialogMode("delete");
  };

  const handleSubmitSettlement = async (
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

    const localSubmissionForm:
      SettlementFormData = {
        ...form,

        householdId:
          household.id,
      };

    const authorizationForm:
      SettlementFormData =
        shouldEnforceSettlementAuth
          ? createCloudSettlementForm(
              form,
              household,
              membership,
              cloudHouseholdId
            )
          : localSubmissionForm;

    const settlementAction =
      dialogMode === "edit" &&
      selectedSettlement
        ? "update"
        : "create";

    if (
      shouldEnforceSettlementAuth &&
      !canAccessSettlementRecord(
        authorizationContext,
        authorizationForm,
        settlementAction
      )
    ) {
      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            settlementAction ===
            "create"
              ? "You can only record settlements where you are the payer or receiver."
              : "You can only update settlements where you are the payer or receiver.",
        },
        "Settlement was not saved."
      );
    }

    const result =
      dialogMode === "edit" &&
      selectedSettlement
        ? await update(
            selectedSettlement.id,
            localSubmissionForm
          )
        : await create(
            localSubmissionForm
          );

    if (result.success) {
      closeDialog();
    }

    return result;
  };

  const handleDeleteConfirm = async (
    settlement: Settlement
  ) => {
    setIsDeletingSettlement(true);

    const authorizationSettlement =
      shouldEnforceSettlementAuth
        ? createCloudSettlementAccessRecord(
            settlement,
            household,
            membership,
            cloudHouseholdId
          )
        : settlement;

    const result =
      shouldEnforceSettlementAuth &&
      !canAccessSettlementRecord(
        authorizationContext,
        authorizationSettlement,
        "delete"
      )
        ? OperationResults.failure<
            boolean
          >(
            {
              general:
                "Only a household admin can delete settlement records.",
            },
            "Settlement was not deleted."
          )
        :
      await remove(
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
      setIsDeletingSettlement(false);

      return;
    }

    closeDialog();
  };

  const getMemberName = (
    memberId: string
  ): string => {
    if (
      shouldEnforceSettlementAuth &&
      memberId ===
        membership?.memberId
    ) {
      const localOwnerMemberId =
        household?.authenticatedLink
          ?.ownerMemberId;
      const localOwner =
        members.find(
          (member) =>
            member.id ===
            localOwnerMemberId
        );

      if (localOwner) {
        return localOwner.displayName;
      }
    }

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
          canRecordSettlement
            ? handleAddSettlement
            : undefined
        }
      />

      <div className="space-y-6">
        {(membershipError ||
          settlementError ||
          authorizationError) && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {authorizationError ||
              settlementError ||
              membershipError}
          </section>
        )}

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
            getMemberName={
              getMemberName
            }
            onView={
              handleViewSettlement
            }
            onEdit={
              canRecordSettlement
                ? handleEditSettlement
                : undefined
            }
            onDelete={
              canManageSettlementRecords
                ? handleDeleteRequest
                : undefined
            }
          />
        </section>
      </div>

      <Dialog
        open={isFormDialogOpen}
        onClose={closeDialog}
        className="hfos-dialog--large"
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
                canRecordSettlement
                  ? handleEditSettlement
                  : undefined
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
              isDeleting={
                isDeletingSettlement
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
