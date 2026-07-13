import { useMemo, useState } from "react";

import type { Transaction } from "../models/Transaction";
import type { TransactionForm } from "../models/TransactionForm";

import TransactionService from "../services/TransactionService";

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
  ) => {
    const result = TransactionService.create(
      form,
      householdId
    );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Updates a transaction and refreshes local state
   * after a successful operation.
   */
  const update = (
    id: string,
    form: TransactionForm
  ) => {
    const result = TransactionService.update(
      id,
      form
    );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Deletes a transaction and refreshes local state
   * after a successful operation.
   */
  const remove = (id: string) => {
    const result = TransactionService.delete(id);

    if (result.success) {
      refresh();
    }

    return result;
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