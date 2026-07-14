import { useState } from "react";

import {
  Dialog,
  DialogBody,
  DialogHeader,
} from "../../../shared/ui";

import {
  OperationResults,
} from "../../../shared/types";

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

export default function SettlementsPage() {
  const household =
    loadHousehold();

  const householdId =
    household?.id ?? "";

  const {
    settlements,
    memberBalances,
    obligations,
    totalOutstanding,

    create,
    update,
    remove,
  } = useSettlements(
    householdId
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
    household
      ? HouseholdMemberService
          .getActiveMembers()
          .filter(
            (member) =>
              member.householdId ===
              household.id
          )
      : [];

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

  const formAllocationOptions =
    household
      ? dialogMode === "edit" &&
        selectedSettlement
        ? SettlementAllocationService
            .getAllocationsForSettlementEdit(
              household.id,
              selectedSettlement.id
            )
        : SettlementAllocationService
            .getOutstandingAllocations(
              household.id
            )
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
        onAddSettlement={
          handleAddSettlement
        }
      />

      <div className="space-y-6">
        <section className="rounded-lg border bg-white p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Total Outstanding
          </p>

          <p className="mt-2 text-3xl font-semibold text-foreground">
            {new Intl.NumberFormat(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            ).format(
              totalOutstanding
            )}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Combined unpaid reimbursements across all
            household members.
          </p>
        </section>

        <MemberBalanceSummary
          balances={
            memberBalances
          }
          members={members}
        />

        <WhoOwesWhomSummary
          obligations={
            obligations
          }
          members={members}
        />

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
              settlements
            }
            members={members}
            accounts={accounts}
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