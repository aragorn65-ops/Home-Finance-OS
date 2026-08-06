import {
  useMemo,
  useState,
} from "react";

import "./TransactionsPage.css";

import {
  Dialog,
  DialogBody,
  DialogHeader,
} from "../../../shared/ui";

import {
  OperationResults,
} from "../../../shared/types/index";

import {
  formatDateInput,
  isSameMonth,
  parseMonthInput,
} from "../../../shared/utils/monthSelection";
import useReportingMonth from "../../../shared/hooks/useReportingMonth";

import AccountService from "../../accounts/services/AccountService";
import {
  useHouseholdMembership,
} from "../../auth";

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
import resolveTransactionMemberId from "../services/transactionMemberResolution";

import type { AllocationPaymentStatus } from "../models/ExpenseAllocation";
import type { Transaction } from "../models/Transaction";

import type {
  TransactionForm as TransactionFormData,
} from "../models/TransactionForm";

import {
  defaultTransactionForm,
} from "../models/TransactionForm";

type TransactionDialogMode =
  | "create"
  | "edit"
  | "view"
  | "delete"
  | null;

const unlinkedCashPaymentAccountId =
  "__cash__";

function mapTransactionToForm(
  transaction: Transaction
): TransactionFormData {
  const storedAllocations =
    transaction.type === "expense"
      ? TransactionService.getExpenseAllocations(
          transaction.id
        )
      : [];

  const transactionMemberId =
    resolveTransactionMemberId(
      transaction,
      storedAllocations
    );

  return {
    type:
      transaction.type,

    amount:
      transaction.enteredAmount ??
      transaction.amount,

    enteredAmount:
      transaction.enteredAmount ??
      transaction.amount,

    enteredCurrency:
      transaction.enteredCurrency ??
      transaction.baseCurrency ??
      "",

    baseAmount:
      transaction.baseAmount ??
      transaction.amount,

    exchangeRate:
      transaction.exchangeRate ?? 1,
    exchangeRateEffectiveDate:
      transaction.exchangeRateEffectiveDate
        ? formatDateInput(
            transaction.exchangeRateEffectiveDate
          )
        : formatDateInput(
            transaction.transactionDate
          ),
    exchangeRateSource:
      transaction.exchangeRateSource ??
      "manual",
    exchangeRateProvider:
      transaction.exchangeRateProvider ?? "",

    paidByMemberId:
      transactionMemberId,

    visibility:
      transaction.visibility ??
      "household",

    sourceAccountId:
      transaction.type === "expense" &&
      !transaction.sourceAccountId
        ? unlinkedCashPaymentAccountId
        : transaction.sourceAccountId ?? "",

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
          (
            storedAllocations.length > 0
              ? "exact"
              : "none"
          )
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

          personalAmount:
            allocation.personalAmount ??
            0,

          personalItems:
            allocation.personalItems?.map(
              (item) => ({
                ...item,
              })
            ) ?? [],

          notes:
            allocation.notes ??
            "",
        })
      ),

    attachments:
      transaction.attachments?.map(
        (attachment) => ({
          ...attachment,

          createdAt:
            new Date(
              attachment.createdAt
            ),
        })
      ) ?? [],

    isActive:
      transaction.isActive,
  };
}

function defaultCreateTransactionForm(
  currency = "PHP"
):
  TransactionFormData {
  return {
    ...defaultTransactionForm,

    paidByMemberId: "",
    enteredCurrency:
      currency,
    exchangeRate: 1,
    exchangeRateEffectiveDate: "",
    exchangeRateSource: "manual",
    exchangeRateProvider: "",

    attachments: [],

    allocations: [],

    isActive: true,
  };
}

export default function TransactionsPage() {
  const {
    selectedMonthValue,
    setSelectedMonthValue,
  } = useReportingMonth();

  const selectedMonth =
    parseMonthInput(
      selectedMonthValue
    );

  const {
    transactions,
    create,
    update,
    remove,
  } = useTransactions();

  const household =
    loadHousehold();
  const authHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    household?.id ??
    "";
  const {
    session,
    membership,
  } = useHouseholdMembership(
    authHouseholdId
  );
  const isReadOnlyMember =
    session.status === "signed-in" &&
    (
      membership?.role === "member" ||
      membership?.role === "viewer"
    );

  const currency =
    household?.currency ?? "PHP";

  const accounts =
    AccountService
      .getActiveAccounts()
      .filter(
        (account) =>
          account.householdId ===
          household?.id
      );

  const members =
    household
      ? HouseholdMemberService
          .getMembers()
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
  const [
    isDeletingTransaction,
    setIsDeletingTransaction,
  ] = useState(false);

  const createTransactionInitialValues =
    useMemo(
      () => ({
        ...defaultCreateTransactionForm(
          currency
        ),

        transactionDate:
          formatDateInput(
            parseMonthInput(
              selectedMonthValue
            )
          ),
      }),
      [
        selectedMonthValue,
        currency,
      ]
    );

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedTransaction(null);
    setDeleteError("");
  };

  const handleAddTransaction = () => {
    if (isReadOnlyMember) {
      return;
    }

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
    if (isReadOnlyMember) {
      return;
    }

    setSelectedTransaction(
      transaction
    );

    setDeleteError("");
    setDialogMode("edit");
  };

  const handleDeleteRequest = (
    transaction: Transaction
  ) => {
    if (isReadOnlyMember) {
      return;
    }

    setSelectedTransaction(
      transaction
    );

    setDeleteError("");
    setDialogMode("delete");
  };

  const handleSubmitTransaction = async (
    form: TransactionFormData
  ) => {
    if (isReadOnlyMember) {
      return OperationResults.failure<Transaction>(
        {
          general:
            "Member access is read-only for transactions.",
        },
        "Unable to save the transaction."
      );
    }

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
        ? await update(
            selectedTransaction.id,
            form
          )
        : await create(
            form,
            household.id
          );

    if (result.success) {
      closeDialog();
    }

    return result;
  };

  const handleDeleteConfirm = async (
    transaction: Transaction
  ) => {
    if (isReadOnlyMember) {
      return;
    }

    if (isDeletingTransaction) {
      return;
    }

    setIsDeletingTransaction(true);

    const result =
      await remove(transaction.id);

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
      setIsDeletingTransaction(false);

      return;
    }

    setIsDeletingTransaction(false);
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
        account.id ===
        accountId
    )?.name;
  };

  const householdTransactions =
    transactions.filter(
      (transaction) =>
        transaction.householdId ===
          household?.id &&
        isSameMonth(
          transaction.transactionDate,
          selectedMonth
        )
    );

  const paymentStatusByTransactionId =
    householdTransactions.reduce<
      Record<
        string,
        AllocationPaymentStatus | undefined
      >
    >(
      (
        statuses,
        transaction
      ) => {
        statuses[transaction.id] =
          TransactionService
            .getExpensePaymentStatus(
              transaction.id
            );

        return statuses;
      },
      {}
    );

  const isFormDialogOpen =
    !isReadOnlyMember &&
    (
      dialogMode === "create" ||
      dialogMode === "edit"
    );

  return (
    <>
      <TransactionToolbar
        selectedMonth={
          selectedMonthValue
        }
        onSelectedMonthChange={
          setSelectedMonthValue
        }
        onAddTransaction={
          isReadOnlyMember
            ? undefined
            : handleAddTransaction
        }
      />

      <div className="space-y-6">
        <TransactionList
          transactions={
            householdTransactions
          }
          accounts={accounts}
          currency={currency}
          paymentStatusByTransactionId={
            paymentStatusByTransactionId
          }
          onView={
            handleViewTransaction
          }
          onEdit={
            isReadOnlyMember
              ? undefined
              : handleEditTransaction
          }
          onDelete={
            isReadOnlyMember
              ? undefined
              : handleDeleteRequest
          }
        />
      </div>

      <Dialog
        open={isFormDialogOpen}
        onClose={closeDialog}
        className="hfos-transaction-dialog"
      >
        <DialogHeader
          title={
            dialogMode === "edit"
              ? "Edit Transaction"
              : "Add Transaction"
          }
        />

        <DialogBody className="hfos-transaction-dialog__body">
          <TransactionForm
            accounts={accounts}
            members={members}
            currency={currency}
            initialValues={
              dialogMode === "edit" &&
              selectedTransaction
                ? mapTransactionToForm(
                    selectedTransaction
                  )
                : createTransactionInitialValues
            }
            submitLabel={
              dialogMode === "edit"
                ? "Update Transaction"
                : "Create Transaction"
            }
            onSubmit={
              handleSubmitTransaction
            }
            onCancel={
              closeDialog
            }
          />
        </DialogBody>
      </Dialog>

      <Dialog
        open={
          dialogMode === "view" &&
          selectedTransaction !== null
        }
        onClose={closeDialog}
        className="hfos-transaction-dialog"
      >
        <DialogHeader
          title="Transaction Details"
        />

        <DialogBody className="hfos-transaction-dialog__body">
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
              currency={currency}
              onClose={
                closeDialog
              }
              onEdit={
                isReadOnlyMember
                  ? undefined
                  : handleEditTransaction
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
              isDeleting={
                isDeletingTransaction
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
