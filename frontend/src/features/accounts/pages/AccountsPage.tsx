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
  canAccessAccount,
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
  const isSignedIn =
    session.status === "signed-in";
  const currentMemberId =
    membership?.memberId ?? "";
  const isMemberRole =
    isSignedIn &&
    membership?.role === "member";

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
  const authorizationContext =
    useMemo(
      () => ({
        userId:
          session.status === "signed-in"
            ? session.user?.id
            : undefined,
        memberId:
          currentMemberId,
        membership:
          membership ?? undefined,
      }),
      [
        currentMemberId,
        membership,
        session,
      ]
    );
  const canCreateAccount =
    !isSignedIn ||
    (
      membership?.status === "active" &&
      membership.role !== "viewer"
    );
  const canViewAccountDetails = (
    account: Account
  ) => {
    if (!isSignedIn) {
      return true;
    }

    return canAccessAccount(
      authorizationContext,
      account,
      "view"
    );
  };
  const canEditAccount = (
    account: Account
  ) => {
    if (!isSignedIn) {
      return true;
    }

    return canAccessAccount(
      authorizationContext,
      account,
      "update"
    );
  };
  const canDeleteAccount = (
    account: Account
  ) => {
    if (!isSignedIn) {
      return true;
    }

    return canAccessAccount(
      authorizationContext,
      account,
      "delete"
    );
  };
  const visibleAccounts =
    useMemo(() => {
      if (!isSignedIn) {
        return accounts;
      }

      if (
        membership?.role === "owner" ||
        membership?.role === "admin"
      ) {
        return accounts;
      }

      return accounts.filter(
        (account) =>
          isAccountVisibleForMember(
            account,
            currentMemberId
          )
      );
    }, [
      accounts,
      currentMemberId,
      isSignedIn,
      membership?.role,
    ]);
  const summaryAccounts =
    useMemo(
      () =>
        visibleAccounts.filter(
          canViewAccountDetails
        ),
      [
        authorizationContext,
        isSignedIn,
        visibleAccounts,
      ]
    );
  const visibleTotalBalance =
    useMemo(
      () =>
        summaryAccounts.reduce(
          (total, account) =>
            total +
            (
              account.currentBaseBalance ??
              account.currentBalance
            ),
          0
        ),
      [summaryAccounts]
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
      isMemberRole && currentMemberId
        ? {
            ...createDefaultForm(
              currentMemberId,
              baseCurrency
            ),
            visibility:
              "private",
          }
        : createDefaultForm(
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
    if (!canEditAccount(account)) {
      return;
    }

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
    if (!canDeleteAccount(account)) {
      return;
    }

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

    if (
      !canDeleteAccount(
        deletingAccount
      )
    ) {
      setDeleteError(
        "You do not have permission to delete this account."
      );
      setIsDeletingAccount(false);

      return;
    }

    const result =
      await remove(
        deletingAccount.id,
        {
          persistRemote:
            !isMemberRole,
        }
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

    const normalizedForm =
      isMemberRole && currentMemberId
        ? {
            ...form,
            ownerMemberId:
              currentMemberId,
            visibility:
              "private" as const,
          }
        : form;

    if (!canCreateAccount) {
      const nextErrors = {
        general:
          "You do not have permission to add or edit accounts.",
      };

      setSaveError(nextErrors.general);
      showValidationAlert(
        nextErrors
      );

      return;
    }

    if (
      editingAccount &&
      !canEditAccount(
        editingAccount
      )
    ) {
      const nextErrors = {
        general:
          "You do not have permission to edit this account.",
      };

      setSaveError(nextErrors.general);
      showValidationAlert(
        nextErrors
      );

      return;
    }

    if (
      isMemberRole &&
      (
        normalizedForm.ownerMemberId !==
          currentMemberId ||
        normalizedForm.visibility !==
          "private"
      )
    ) {
      const nextErrors = {
        general:
          "Members can only save personal accounts they own.",
      };

      setSaveError(nextErrors.general);
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
            normalizedForm,
            {
              persistRemote:
                !isMemberRole,
            }
          )
        : await create(
            normalizedForm,
            household.id,
            {
              persistRemote:
                !isMemberRole,
            }
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
          canCreateAccount
            ? handleAddAccount
            : undefined
        }
      />

      <div className="space-y-6">
        <AccountSummary
          totalAccounts={
            summaryAccounts.length
          }
          totalBalance={
            isSignedIn
              ? visibleTotalBalance
              : totalBalance
          }
          currency={baseCurrency}
        />

        <AccountList
          accounts={visibleAccounts}
          canViewDetails={
            canViewAccountDetails
          }
          canEdit={canEditAccount}
          canDelete={canDeleteAccount}
          onEdit={handleEditAccount}
          onDelete={handleDeleteRequest}
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
            lockedOwnerMemberId={
              isMemberRole
                ? currentMemberId
                : undefined
            }
            lockedVisibility={
              isMemberRole
                ? "private"
                : undefined
            }
            onChange={(nextForm) => {
              setForm(
                isMemberRole &&
                  currentMemberId
                  ? {
                      ...nextForm,
                      ownerMemberId:
                        currentMemberId,
                      visibility:
                        "private",
                    }
                  : nextForm
              );
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
            ? canViewAccountDetails(
                deletingAccount
              )
              ? `Are you sure you want to delete "${deletingAccount.name}"?`
              : "Are you sure you want to delete this personal account? Details are visible only to the owner."
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
