import { useMemo, useState } from "react";

import type { Account } from "../models/Account";
import type { AccountForm } from "../models/AccountForm";

import AccountService from "../services/AccountService";

export default function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(
    AccountService.getActiveAccounts()
  );

  const refresh = () => {
    setAccounts(AccountService.getActiveAccounts());
  };

  const create = (
    form: AccountForm,
    householdId: string
  ) => {
    const result = AccountService.create(
      form,
      householdId
    );

    if (result.success) {
      refresh();
    }

    return result;
  };

  const update = (
    id: string,
    form: AccountForm
  ) => {
    const result = AccountService.update(
      id,
      form
    );

    if (result.success) {
      refresh();
    }

    return result;
  };

  const remove = (id: string) => {
    const result = AccountService.delete(id);

    if (result.success) {
      refresh();
    }

    return result;
  };

  const totalBalance = useMemo(() => {
    return accounts.reduce(
      (total, account) =>
        total + account.currentBalance,
      0
    );
  }, [accounts]);

  return {
    accounts,
    totalBalance,
    create,
    update,
    remove,
    refresh,
  };
}