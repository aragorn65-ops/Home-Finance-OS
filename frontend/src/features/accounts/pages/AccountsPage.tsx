import {
  useMemo,
  useState,
} from "react";

import {
  ConfirmDialog,
  FormValidationAlert,
} from "../../../shared/ui";

import AccountToolbar from "../components/AccountToolbar";
import AccountDialog from "../components/AccountDialog";
import AccountForm from "../components/AccountForm";
import AccountList from "../components/AccountList";
import AccountSummary from "../components/AccountSummary";

import useAccounts from "../hooks/useAccounts";
import {
  useHouseholdMembership,
} from "../../auth";

import HouseholdMemberService from "../../household/services/HouseholdMemberService";

import {
  loadHousehold,
} from "../../household/services/householdStorage";

import type { Account } from "../models/Account";
import {
  isAccountVisibleForMember,
} from "../services/accountVisibility";

import {
  defaultAccountForm,
  type AccountForm as AccountFormModel,
} from "../models/AccountForm";

const accountFieldLabels:
  Record<string, string> = {
    general: "General",
    ownerMemberId: "Account Owner",
    visibility: "Visibility",
    name: "Account Name",
    institution: "Institution",
    accountClass: "Account Class",
    type: "Account Type",
    currency: "Currency",
    baseCurrency: "Base Currency",
    exchangeRate: "Exchange Rate",
    exchangeRateEffectiveDate:
      "Rate Effective Date",
    balance: "Current Balance",
    creditLimit: "Credit Limit",
    statementBalance:
      "Current Statement Balance",
    minimumPayment: "Minimum Payment",
    paymentDueDate: "Payment Due Date",
    isActive: "Active account",
  };

function formatDateInput(
  date?: Date
): string {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createDefaultForm(
  ownerMemberId: string,
  baseCurrency = "PHP"
): AccountFormModel {
  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  return {
    ...defaultAccountForm,
    ownerMemberId,
    currency:
      baseCurrency,
    baseCurrency,
    exchangeRate: 1,
    exchangeRateEffectiveDate:
      today,
    exchangeRateSource: "manual",
    exchangeRateProvider: "",
  };
}

function mapAccountToForm(
  account: Account
): AccountFormModel {
  return {
    ownerMemberId:
      account.ownerMemberId,

    visibility:
      account.visibility,

    name:
      account.name,

    institution:
      account.institution ?? "",

    accountClass:
      account.accountClass,

    type:
      account.type,

    currency:
      account.currency,

    baseCurrency:
      account.baseCurrency ??
      account.currency,

    exchangeRate:
      account.exchangeRate ?? 1,

    exchangeRateEffectiveDate:
      formatDateInput(
        account.exchangeRateEffectiveDate
      ),
    exchangeRateSource:
      account.exchangeRateSource ??
      "manual",
    exchangeRateProvider:
      account.exchangeRateProvider ?? "",

    balance:
      account.currentBalance,

    creditLimit:
      account.creditLimit ?? 0,

    statementBalance:
      account.statementBalance ?? 0,

    minimumPayment:
      account.minimumPayment ?? 0,

    paymentDueDate:
      formatDateInput(
        account.paymentDueDate
      ),

    isActive:
      account.isActive,
  };
}

function getFirstError(
  errors?: Record<string, string>
): string | undefined {
  if (!errors) {
    return undefined;
  }

  return Object.values(errors)[0];
}

export default function AccountsPage() {
  const {
    accounts,
    totalBalance,
    create,
    update,
    remove,
  } = useAccounts();

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

  const members =
    HouseholdMemberService.getActiveMembers();

  const defaultOwnerMemberId =
    HouseholdMemberService
      .getOwnerMember()
      ?.id ??
    members[0]?.id ??
    "";

  const baseCurrency =
    household?.currency ?? "PHP";
  const visibleAccounts =
    useMemo(() => {
      if (!isReadOnlyMember) {
        return accounts;
      }

      return accounts.filter((account) =>
        isAccountVisibleForMember(
          account,
          membership?.memberId ?? ""
        )
      );
    }, [
      accounts,
      isReadOnlyMember,
      membership?.memberId,
    ]);
  const visibleTotalBalance =
    useMemo(
      () =>
        visibleAccounts.reduce(
          (total, account) =>
            total +
            (
              account.currentBaseBalance ??
              account.currentBalance
            ),
          0
        ),
      [visibleAccounts]
    );

  const [isDialogOpen, setIsDialogOpen] =
    useState(false);

  const [
    editingAccount,
    setEditingAccount,
  ] = useState<Account | null>(null);

  const [
    deletingAccount,
    setDeletingAccount,
  ] = useState<Account | null>(null);

  const [form, setForm] =
    useState<AccountFormModel>(
      createDefaultForm(
        defaultOwnerMemberId,
        baseCurrency
      )
    );

  const [saveError, setSaveError] =
    useState("");

  const [
    validationAlertErrors,
    setValidationAlertErrors,
  ] = useState<Record<string, string>>(
    {}
  );

  const [
    isValidationAlertOpen,
    setIsValidationAlertOpen,
  ] = useState(false);

  const [deleteError, setDeleteError] =
    useState("");
  const [isSavingAccount, setIsSavingAccount] =
    useState(false);
  const [
    isDeletingAccount,
    setIsDeletingAccount,
  ] = useState(false);

  const showValidationAlert = (
    nextErrors:
      Record<string, string> | undefined,
    fallbackMessage =
      "Please correct the highlighted fields."
  ) => {
    const visibleErrors =
      nextErrors &&
      Object.keys(nextErrors).length >
        0
        ? nextErrors
        : {
            general:
              fallbackMessage,
          };

    setValidationAlertErrors(
      visibleErrors
    );

    setIsValidationAlertOpen(
      true
    );
  };

  const resetDialog = () => {
    setEditingAccount(null);

    setForm(
      createDefaultForm(
        defaultOwnerMemberId,
        baseCurrency
      )
    );

    setSaveError("");
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setIsDialogOpen(false);
  };

  const handleAddAccount = () => {
    setEditingAccount(null);

    setForm(
      createDefaultForm(
        defaultOwnerMemberId,
        baseCurrency
      )
    );

    setSaveError("");
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setIsDialogOpen(true);
  };

  const handleEditAccount = (
    account: Account
  ) => {
    setEditingAccount(account);

    setForm(
      mapAccountToForm(account)
    );

    setSaveError("");
    setValidationAlertErrors({});
    setIsValidationAlertOpen(false);
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (
    account: Account
  ) => {
    setDeleteError("");
    setDeletingAccount(account);
  };

  const handleDeleteCancel = () => {
    setDeleteError("");
    setDeletingAccount(null);
  };

  const handleDeleteConfirm =
    async () => {
    if (
      !deletingAccount ||
      isDeletingAccount
    ) {
      return;
    }

    setIsDeletingAccount(true);

    const result =
      await remove(
        deletingAccount.id
      );

    if (!result.success) {
      setDeleteError(
        result.message ??
          getFirstError(
            result.errors
          ) ??
          "Unable to delete the account."
      );
      setIsDeletingAccount(false);

      return;
    }

    setDeleteError("");
    setDeletingAccount(null);
    setIsDeletingAccount(false);
  };

  const handleSaveAccount =
    async () => {
    if (isSavingAccount) {
      return;
    }

    setSaveError("");

    if (!household) {
      const nextErrors = {
        general:
          "Complete household setup before creating an account.",
      };

      setSaveError(nextErrors.general);
      showValidationAlert(
        nextErrors
      );

      return;
    }

    if (!form.ownerMemberId) {
      const nextErrors = {
        ownerMemberId:
          "Select the member who owns this account.",
      };

      setSaveError(
        nextErrors.ownerMemberId
      );
      showValidationAlert(
        nextErrors
      );

      return;
    }

    setIsSavingAccount(true);

    const result =
      editingAccount
        ? await update(
            editingAccount.id,
            form
          )
        : await create(
            form,
            household.id
          );

    if (!result.success) {
      const nextSaveError =
        result.message ??
          getFirstError(
            result.errors
          ) ??
          "Unable to save the account.";

      setSaveError(nextSaveError);
      showValidationAlert(
        result.errors,
        nextSaveError
      );
      setIsSavingAccount(false);

      return;
    }

    setIsSavingAccount(false);
    resetDialog();
  };

  return (
    <>
      <AccountToolbar
        onAddAccount={
          isReadOnlyMember
            ? undefined
            : handleAddAccount
        }
      />

      <div className="space-y-6">
        <AccountSummary
          totalAccounts={
            visibleAccounts.length
          }
          totalBalance={
            isReadOnlyMember
              ? visibleTotalBalance
              : totalBalance
          }
          currency={baseCurrency}
        />

        <AccountList
          accounts={visibleAccounts}
          onEdit={
            isReadOnlyMember
              ? undefined
              : handleEditAccount
          }
          onDelete={
            isReadOnlyMember
              ? undefined
              : handleDeleteRequest
          }
        />
      </div>

      <AccountDialog
        open={isDialogOpen}
        title={
          editingAccount
            ? "Edit Account"
            : "Add Account"
        }
        saveLabel={
          editingAccount
            ? "Update Account"
            : "Create Account"
        }
        onClose={resetDialog}
        onSave={handleSaveAccount}
        isSaving={isSavingAccount}
      >
        <div className="space-y-4">
          <FormValidationAlert
            open={isValidationAlertOpen}
            errors={
              validationAlertErrors
            }
            fieldLabels={
              accountFieldLabels
            }
            onClose={() =>
              setIsValidationAlertOpen(
                false
              )
            }
          />

          {saveError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          {members.length === 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No active household member is available.
              Complete household setup before creating an
              account.
            </div>
          )}

          <AccountForm
            value={form}
            members={members}
            baseCurrency={
              baseCurrency
            }
            isEditing={
              editingAccount !== null
            }
            onChange={(nextForm) => {
              setForm(nextForm);
              setSaveError("");
              setIsValidationAlertOpen(
                false
              );
            }}
          />
        </div>
      </AccountDialog>

      <ConfirmDialog
        open={
          deletingAccount !== null
        }
        title="Delete Account"
        message={
          deleteError ||
          (deletingAccount
            ? `Are you sure you want to delete "${deletingAccount.name}"?`
            : "")
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={
          handleDeleteConfirm
        }
        isConfirming={
          isDeletingAccount
        }
        onCancel={
          handleDeleteCancel
        }
      />
    </>
  );
}
