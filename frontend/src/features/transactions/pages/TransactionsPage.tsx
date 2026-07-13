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

import TransactionDeleteConfirmation from "../components/TransactionDeleteConfirmation";
import TransactionDetails from "../components/TransactionDetails";
import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import TransactionToolbar from "../components/TransactionToolbar";

import useTransactions from "../hooks/useTransactions";

import TransactionService from "../services/TransactionService";

import type { Transaction } from "../models/Transaction";

import type {
  TransactionForm as TransactionFormData,
} from "../models/TransactionForm";

type TransactionDialogMode =
  | "create"
  | "edit"
  | "view"
  | "delete"
  | null;

function formatDateInput(
  date: Date
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapTransactionToForm(
  transaction: Transaction
): TransactionFormData {
  const storedAllocations =
    transaction.type === "expense"
      ? TransactionService.getExpenseAllocations(
          transaction.id
        )
      : [];

  return {
    type: transaction.type,
    amount: transaction.amount,

    paidByMemberId:
      transaction.paidByMemberId ??
      transaction.createdByMemberId ??
      "",

    visibility:
      transaction.visibility ??
      "household",

    sourceAccountId:
      transaction.sourceAccountId ??
      "",

    destinationAccountId:
      transaction.destinationAccountId ??
      "",

    category:
      transaction.category,

    description:
      transaction.description,

    notes:
      transaction.notes,

    transactionDate:
      formatDateInput(
        transaction.transactionDate
      ),

    splitMethod:
      transaction.type === "expense"
        ? transaction.expenseSplitMethod ??
          (storedAllocations.length > 0
            ? "exact"
            : "none")
        : "none",

    allocations:
      storedAllocations.map(
        (allocation) => ({
          memberId:
            allocation.memberId,

          isIncluded:
            allocation.isIncluded,

          allocatedAmount:
            allocation.allocatedAmount,

          notes:
            allocation.notes ?? "",
        })
      ),

    isActive:
      transaction.isActive,
  };
}

export default function TransactionsPage() {
  const {
    transactions,
    create,
    update,
    remove,
  } = useTransactions();

  const household =
    loadHousehold();

  const accounts =
    AccountService.getActiveAccounts().filter(
      (account) =>
        account.householdId ===
        household?.id
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
  ] = useState<TransactionDialogMode>(
    null
  );

  const [
    selectedTransaction,
    setSelectedTransaction,
  ] = useState<Transaction | null>(
    null
  );

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedTransaction(null);
    setDeleteError("");
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setDeleteError("");
    setDialogMode("create");
  };

  const handleViewTransaction = (
    transaction: Transaction
  ) => {
    setSelectedTransaction(
      transaction
    );

    setDeleteError("");
    setDialogMode("view");
  };

  const handleEditTransaction = (
    transaction: Transaction
  ) => {
    setSelectedTransaction(
      transaction
    );

    setDeleteError("");
    setDialogMode("edit");
  };

  const handleDeleteRequest = (
    transaction: Transaction
  ) => {
    setSelectedTransaction(
      transaction
    );

    setDeleteError("");
    setDialogMode("delete");
  };

  const handleSubmitTransaction = (
    form: TransactionFormData
  ) => {
    if (!household) {
      return OperationResults.failure<Transaction>(
        {
          household:
            "Complete household setup before creating a transaction.",
        },
        "Unable to save the transaction."
      );
    }

    const result =
      dialogMode === "edit" &&
      selectedTransaction
        ? update(
            selectedTransaction.id,
            form
          )
        : create(
            form,
            household.id
          );

    if (result.success) {
      closeDialog();
    }

    return result;
  };

  const handleDeleteConfirm = (
    transaction: Transaction
  ) => {
    const result =
      remove(transaction.id);

    if (!result.success) {
      const errors =
        result.errors ?? {};

      const firstError =
        Object.values(errors)[0];

      setDeleteError(
        result.message ??
          firstError ??
          "Unable to delete the transaction."
      );

      return;
    }

    closeDialog();
  };

  const getAccountName = (
    accountId: string | null
  ): string | undefined => {
    if (!accountId) {
      return undefined;
    }

    return accounts.find(
      (account) =>
        account.id === accountId
    )?.name;
  };

  const householdTransactions =
    transactions.filter(
      (transaction) =>
        transaction.householdId ===
        household?.id
    );

  const isFormDialogOpen =
    dialogMode === "create" ||
    dialogMode === "edit";

  return (
    <>
      <TransactionToolbar
        onAddTransaction={
          handleAddTransaction
        }
      />

      <div className="space-y-6">
        <TransactionList
          transactions={
            householdTransactions
          }
          accounts={accounts}
          onView={
            handleViewTransaction
          }
          onEdit={
            handleEditTransaction
          }
          onDelete={
            handleDeleteRequest
          }
        />
      </div>

      <Dialog
        open={isFormDialogOpen}
        onClose={closeDialog}
      >
        <DialogHeader
          title={
            dialogMode === "edit"
              ? "Edit Transaction"
              : "Add Transaction"
          }
        />

        <DialogBody>
          <TransactionForm
            accounts={accounts}
            members={members}
            initialValues={
              dialogMode === "edit" &&
              selectedTransaction
                ? mapTransactionToForm(
                    selectedTransaction
                  )
                : undefined
            }
            submitLabel={
              dialogMode === "edit"
                ? "Update Transaction"
                : "Create Transaction"
            }
            onSubmit={
              handleSubmitTransaction
            }
            onCancel={closeDialog}
          />
        </DialogBody>
      </Dialog>

      <Dialog
        open={
          dialogMode === "view" &&
          selectedTransaction !== null
        }
        onClose={closeDialog}
      >
        <DialogHeader
          title="Transaction Details"
        />

        <DialogBody>
          {selectedTransaction && (
            <TransactionDetails
              transaction={
                selectedTransaction
              }
              sourceAccountName={
                getAccountName(
                  selectedTransaction
                    .sourceAccountId
                )
              }
              destinationAccountName={
                getAccountName(
                  selectedTransaction
                    .destinationAccountId
                )
              }
              onClose={closeDialog}
              onEdit={
                handleEditTransaction
              }
            />
          )}
        </DialogBody>
      </Dialog>

      <Dialog
        open={
          dialogMode === "delete" &&
          selectedTransaction !== null
        }
        onClose={closeDialog}
      >
        <DialogBody>
          {selectedTransaction && (
            <TransactionDeleteConfirmation
              transaction={
                selectedTransaction
              }
              errorMessage={
                deleteError
              }
              onConfirm={
                handleDeleteConfirm
              }
              onCancel={closeDialog}
            />
          )}
        </DialogBody>
      </Dialog>
    </>
  );
}