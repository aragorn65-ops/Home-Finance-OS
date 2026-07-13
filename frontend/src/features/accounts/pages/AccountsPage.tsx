import { useState } from "react";

import {
  ConfirmDialog,
} from "../../../shared/ui";

import AccountToolbar from "../components/AccountToolbar";
import AccountDialog from "../components/AccountDialog";
import AccountForm from "../components/AccountForm";
import AccountList from "../components/AccountList";
import AccountSummary from "../components/AccountSummary";

import useAccounts from "../hooks/useAccounts";

import type { Account } from "../models/Account";

import {
  defaultAccountForm,
  type AccountForm as AccountFormModel,
} from "../models/AccountForm";

export default function AccountsPage() {
  const {
    accounts,
    totalBalance,
    create,
    update,
    remove,
  } = useAccounts();

  const [isDialogOpen, setIsDialogOpen] =
    useState(false);

  const [editingAccount, setEditingAccount] =
    useState<Account | null>(null);

  const [deletingAccount, setDeletingAccount] =
    useState<Account | null>(null);

  const [form, setForm] =
    useState<AccountFormModel>(
      defaultAccountForm
    );

  const resetDialog = () => {
    setEditingAccount(null);
    setForm(defaultAccountForm);
    setIsDialogOpen(false);
  };

  const handleAddAccount = () => {
    resetDialog();
    setIsDialogOpen(true);
  };

  const handleEditAccount = (
    account: Account
  ) => {
    setEditingAccount(account);

    setForm({
      name: account.name,
      institution:
        account.institution ?? "",
      type: account.type,
      currency: account.currency,
      balance: account.openingBalance,
      isActive: account.isActive,
    });

    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (
    account: Account
  ) => {
    setDeletingAccount(account);
  };

  const handleDeleteCancel = () => {
    setDeletingAccount(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingAccount) {
      return;
    }

    const result = remove(
      deletingAccount.id
    );

    if (!result.success) {
      console.error(result.errors);
      return;
    }

    setDeletingAccount(null);
  };

  const handleSaveAccount = () => {
    const result = editingAccount
      ? update(editingAccount.id, form)
      : create(form, "household-001");

    if (!result.success) {
      console.error(result.errors);
      return;
    }

    resetDialog();
  };

  return (
    <>
      <AccountToolbar
        onAddAccount={handleAddAccount}
      />

      <div className="space-y-6">
        <AccountSummary
          totalAccounts={accounts.length}
          totalBalance={totalBalance}
        />

        <AccountList
          accounts={accounts}
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
      >
        <AccountForm
          value={form}
          onChange={setForm}
        />
      </AccountDialog>

      <ConfirmDialog
        open={deletingAccount !== null}
        title="Delete Account"
        message={
          deletingAccount
            ? `Are you sure you want to delete "${deletingAccount.name}"?`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}