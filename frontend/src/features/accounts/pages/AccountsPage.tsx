import { useState } from "react";

import AccountToolbar from "../components/AccountToolbar";
import AccountDialog from "../components/AccountDialog";
import AccountForm from "../components/AccountForm";
import AccountList from "../components/AccountList";
import AccountSummary from "../components/AccountSummary";

import useAccounts from "../hooks/useAccounts";

import {
  defaultAccountForm,
  type AccountForm as AccountFormModel,
} from "../models/AccountForm";

export default function AccountsPage() {
  const {
    accounts,
    totalBalance,
    create,
  } = useAccounts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] =
    useState<AccountFormModel>(defaultAccountForm);

  const handleAddAccount = () => {
    setForm(defaultAccountForm);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSaveAccount = () => {
    const result = create(form, "household-001");

    if (!result.success) {
      console.error(result.errors);
      return;
    }

    setIsDialogOpen(false);
    setForm(defaultAccountForm);
  };

  return (
    <>
      <AccountToolbar onAddAccount={handleAddAccount} />

      <div className="space-y-6">
        <AccountSummary
          totalAccounts={accounts.length}
          totalBalance={totalBalance}
        />

        <AccountList accounts={accounts} />
      </div>

      <AccountDialog
        open={isDialogOpen}
        title="Add Account"
        onClose={handleCloseDialog}
        onSave={handleSaveAccount}
        saveLabel="Create Account"
      >
        <AccountForm
          value={form}
          onChange={setForm}
        />
      </AccountDialog>
    </>
  );
}