import { useMemo, useState } from "react";

import type { Settlement } from "../models/Settlement";
import type { SettlementForm } from "../models/SettlementForm";

import type { MemberSettlementBalance } from "../models/MemberSettlementBalance";

import type { MemberSettlementObligation } from "../models/MemberSettlementObligation";

import SettlementService from "../services/SettlementService";

import SettlementBalanceService from "../services/SettlementBalanceService";

export default function useSettlements(
  householdId: string
) {
  const loadSettlements = (): Settlement[] => {
    if (!householdId.trim()) {
      return [];
    }

    return SettlementService
      .getActiveSettlementsByHouseholdId(
        householdId
      );
  };

  const loadMemberBalances =
    (): MemberSettlementBalance[] => {
      if (!householdId.trim()) {
        return [];
      }

      return SettlementBalanceService
        .getMemberBalances(
          householdId
        );
    };

  const loadObligations =
    (): MemberSettlementObligation[] => {
      if (!householdId.trim()) {
        return [];
      }

      return SettlementBalanceService
        .getWhoOwesWhom(
          householdId
        );
    };

  const [settlements, setSettlements] =
    useState<Settlement[]>(
      loadSettlements
    );

  const [
    memberBalances,
    setMemberBalances,
  ] = useState<
    MemberSettlementBalance[]
  >(
    loadMemberBalances
  );

  const [
    obligations,
    setObligations,
  ] = useState<
    MemberSettlementObligation[]
  >(
    loadObligations
  );

  /**
   * Reloads settlement records and all derived
   * balance calculations.
   */
  const refresh = () => {
    setSettlements(
      loadSettlements()
    );

    setMemberBalances(
      loadMemberBalances()
    );

    setObligations(
      loadObligations()
    );
  };

  /**
   * Creates a settlement and refreshes all local
   * settlement and balance state after success.
   */
  const create = (
    form: SettlementForm
  ) => {
    const result =
      SettlementService.create(
        form
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Updates a settlement and refreshes all local
   * settlement and balance state after success.
   */
  const update = (
    id: string,
    form: SettlementForm
  ) => {
    const result =
      SettlementService.update(
        id,
        form
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Deletes a settlement and refreshes all local
   * settlement and balance state after success.
   */
  const remove = (
    id: string
  ) => {
    const result =
      SettlementService.delete(
        id
      );

    if (result.success) {
      refresh();
    }

    return result;
  };

  /**
   * Returns the five most recent active settlements.
   */
  const recentSettlements =
    useMemo(() => {
      return settlements.slice(
        0,
        5
      );
    }, [settlements]);

  /**
   * Returns the total remaining amount represented
   * by all debtor-to-creditor obligations.
   */
  const totalOutstanding =
    useMemo(() => {
      const total =
        obligations.reduce(
          (
            currentTotal,
            obligation
          ) =>
            currentTotal +
            obligation.amount,
          0
        );

      return (
        Math.round(total * 100) /
        100
      );
    }, [obligations]);

  return {
    settlements,
    recentSettlements,

    memberBalances,
    obligations,
    totalOutstanding,

    create,
    update,
    remove,
    refresh,
  };
}