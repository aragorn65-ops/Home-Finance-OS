import { useState } from "react";

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
  } = useAccounts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [editingAccount, setEditingAccount] =
    useState<Account | null>(null);

  const [form, setForm] =
    useState<AccountFormModel>(defaultAccountForm);

  const handleAddAccount = () => {
    setEditingAccount(null);
    setForm(defaultAccountForm);
    setIsDialogOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);

    setForm({
      name: account.name,
      institution: account.institution ?? "",
      type: account.type,
      currency: account.currency,
      balance: account.openingBalance,
      isActive: account.isActive,
    });

    setIsDialogOpen(true);
  };

  const resetDialog = () => {
    setEditingAccount(null);
    setForm(defaultAccountForm);
    setIsDialogOpen(false);
  };

  const handleCloseDialog = () => {
    resetDialog();
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
      <AccountToolbar onAddAccount={handleAddAccount} />

      <div className="space-y-6">
        <AccountSummary
          totalAccounts={accounts.length}
          totalBalance={totalBalance}
        />

        <AccountList
          accounts={accounts}
          onEdit={handleEditAccount}
        />
      </div>

      <AccountDialog
        open={isDialogOpen}
        title={
          editingAccount
            ? "Edit Account"
            : "Add Account"
        }
        onClose={handleCloseDialog}
        onSave={handleSaveAccount}
        saveLabel={
          editingAccount
            ? "Update Account"
            : "Create Account"
        }
      >
        <AccountForm
          value={form}
          onChange={setForm}
        />
      </AccountDialog>
    </>
  );
}