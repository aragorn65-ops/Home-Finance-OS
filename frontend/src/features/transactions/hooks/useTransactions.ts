import {
  useMemo,
  useState,
} from "react";

import {
  isAuthFeatureEnabled,
} from "../../../config/auth";
import type {
  OperationResult,
} from "../../../shared/types";
import {
  OperationResults,
} from "../../../shared/types";
import {
  getAuthBackendAdapter,
  saveLinkedRemoteCoreSnapshot,
} from "../../auth";
import {
  browserCoreSnapshotRecordSource,
} from "../../auth/services/browserCoreSnapshotRecordSource";
import {
  loadHousehold,
} from "../../household/services/householdStorage";
import type { Transaction } from "../models/Transaction";
import type { TransactionForm } from "../models/TransactionForm";

import TransactionService from "../services/TransactionService";

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Core transaction snapshot could not be saved.";
}

export default function useTransactions() {
  const [transactions, setTransactions] = useState<
    Transaction[]
  >(
    TransactionService.getActiveTransactions()
  );

  /**
   * Reloads transactions from the service layer.
   */
  const refresh = () => {
    setTransactions(
      TransactionService.getActiveTransactions()
    );
  };

  /**
   * Creates a transaction and refreshes local state
   * after a successful operation.
   */
  const create = (
    form: TransactionForm,
    householdId: string
  ): Promise<OperationResult<Transaction>> => {
    const result =
      TransactionService.create(
        form,
        householdId
      );

    if (result.success) {
      refresh();
    }

    return persistLinkedCoreSnapshot(
      result
    );
  };

  /**
   * Updates a transaction and refreshes local state
   * after a successful operation.
   */
  const update = (
    id: string,
    form: TransactionForm
  ): Promise<OperationResult<Transaction>> => {
    const result =
      TransactionService.update(
        id,
        form
      );

    if (result.success) {
      refresh();
    }

    return persistLinkedCoreSnapshot(
      result
    );
  };

  /**
   * Deletes a transaction and refreshes local state
   * after a successful operation.
   */
  const remove = (
    id: string
  ): Promise<OperationResult<boolean>> => {
    const result =
      TransactionService.delete(id);

    if (result.success) {
      refresh();
    }

    return persistLinkedCoreSnapshot(
      result
    );
  };

  const persistLinkedCoreSnapshot =
    async <T,>(
      result: OperationResult<T>
    ): Promise<OperationResult<T>> => {
      if (!result.success) {
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
          "Cloud transaction snapshot was not saved."
        );
      }
    };

  /**
   * Returns the five most recent transactions
   * from the current local state.
   */
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  return {
    transactions,
    recentTransactions,
    create,
    update,
    remove,
    refresh,
  };
}
