import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  isAuthFeatureEnabled,
} from "../../../config/auth";
import type {
  OperationResult,
} from "../../../shared/types/index";
import {
  OperationResults,
} from "../../../shared/types/index";
import {
  coreSnapshotRestoredEvent,
  getAuthBackendAdapter,
  saveLinkedRemoteCoreSnapshot,
} from "../../auth";
import {
  browserCoreSnapshotRecordSource,
} from "../../auth/services/browserCoreSnapshotRecordSource";
import {
  loadHousehold,
} from "../../household/services/householdStorage";
import type { Account } from "../models/Account";
import type { AccountForm } from "../models/AccountForm";

import AccountService from "../services/AccountService";

interface AccountMutationOptions {
  persistRemote?: boolean;
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Core account snapshot could not be saved.";
}

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

  useEffect(() => {
    window.addEventListener(
      coreSnapshotRestoredEvent,
      refresh
    );

    return () => {
      window.removeEventListener(
        coreSnapshotRestoredEvent,
        refresh
      );
    };
  }, []);

  /**
   * Creates an account and refreshes local state
   * after a successful operation.
   */
  const create = (
    form: AccountForm,
    householdId: string,
    options: AccountMutationOptions = {}
  ): Promise<OperationResult<Account>> => {
    const result =
      AccountService.create(
        form,
        householdId
      );

    if (result.success) {
      refresh();
    }

    return persistLinkedCoreSnapshot(
      result,
      options
    );
  };

  /**
   * Updates an account and refreshes local state
   * after a successful operation.
   *
   * This includes account activation and deactivation.
   */
  const update = (
    id: string,
    form: AccountForm,
    options: AccountMutationOptions = {}
  ): Promise<OperationResult<Account>> => {
    const result =
      AccountService.update(
        id,
        form
      );

    if (result.success) {
      refresh();
    }

    return persistLinkedCoreSnapshot(
      result,
      options
    );
  };

  /**
   * Permanently deletes an account and refreshes
   * local state after a successful operation.
   */
  const remove = (
    id: string,
    options: AccountMutationOptions = {}
  ): Promise<OperationResult<boolean>> => {
    const result =
      AccountService.delete(id);

    if (result.success) {
      refresh();
    }

    return persistLinkedCoreSnapshot(
      result,
      options
    );
  };

  const persistLinkedCoreSnapshot =
    async <T,>(
      result: OperationResult<T>,
      options: AccountMutationOptions
    ): Promise<OperationResult<T>> => {
      if (!result.success) {
        return result;
      }

      if (
        options.persistRemote === false
      ) {
        return result;
      }

      try {
        await saveLinkedRemoteCoreSnapshot({
          authEnabled:
            isAuthFeatureEnabled(),
          household:
            loadHousehold(),
          adapter:
            getAuthBackendAdapter(),
          recordSource:
            browserCoreSnapshotRecordSource,
        });

        return result;
      } catch (error) {
        return OperationResults.failure<T>(
          {
            cloud:
              getErrorMessage(error),
          },
          "Cloud account snapshot was not saved."
        );
      }
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
