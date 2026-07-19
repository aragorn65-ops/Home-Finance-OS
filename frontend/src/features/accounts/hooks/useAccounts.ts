import {
  useMemo,
  useState,
} from "react";

import type { Account } from "../models/Account";
import type { AccountForm } from "../models/AccountForm";

import AccountService from "../services/AccountService";

export default function useAccounts() {
  /**
   * Account management displays both active and inactive
   * accounts so deactivated records can be reviewed and
   * reactivated.
   */
  const [
    accounts,
    setAccounts,
  ] = useState<Account[]>(
    AccountService.getAccounts()
  );

  /**
   * Reloads the complete account collection.
   */
  const refresh = () => {
    setAccounts(
      AccountService.getAccounts()
    );
  };

  /**
   * Creates an account and refreshes local state
   * after a successful operation.
   */
  const create = (
    form: AccountForm,
    householdId: string
  ) => {
    const result =
      AccountService.create(
        form,
        householdId
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Updates an account and refreshes local state
   * after a successful operation.
   *
   * This includes account activation and deactivation.
   */
  const update = (
    id: string,
    form: AccountForm
  ) => {
    const result =
      AccountService.update(
        id,
        form
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Permanently deletes an account and refreshes
   * local state after a successful operation.
   */
  const remove = (
    id: string
  ) => {
    const result =
      AccountService.delete(id);

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Calculates the balance summary from active accounts
   * only.
   *
   * Inactive accounts remain visible for management but
   * are excluded from the active financial summary.
   */
  const totalBalance =
    useMemo(() => {
      return accounts
        .filter(
          (account) =>
            account.isActive
        )
        .reduce(
          (total, account) =>
            total +
            AccountService.getReportingBalance(
              account
            ),
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
