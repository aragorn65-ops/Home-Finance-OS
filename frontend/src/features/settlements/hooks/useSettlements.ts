import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAuthBackendAdapter,
} from "../../auth/services/createAuthBackendAdapter";
import type {
  AuthSettlementObserver,
} from "../../auth/services";
import type {
  RemoteSettlement,
  RemoteSettlementApplicationDraft,
  RemoteSettlementDraft,
} from "../../auth/models";

import type { Settlement } from "../models/Settlement";
import type { SettlementForm } from "../models/SettlementForm";

import type { MemberSettlementBalance } from "../models/MemberSettlementBalance";

import type { MemberSettlementObligation } from "../models/MemberSettlementObligation";

import SettlementService from "../services/SettlementService";

import SettlementBalanceService from "../services/SettlementBalanceService";
import SettlementValidator from "../validators/SettlementValidator";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

interface UseSettlementsOptions {
  remoteEnabled?: boolean;
}

function sortSettlements(
  settlements: Settlement[]
): Settlement[] {
  return [
    ...settlements,
  ].sort(
    (first, second) =>
      second.settlementDate.getTime() -
      first.settlementDate.getTime()
  );
}

function mapRemoteSettlement(
  settlement: RemoteSettlement
): Settlement {
  return {
    id:
      settlement.id,
    householdId:
      settlement.householdId,
    fromMemberId:
      settlement.fromMemberId,
    toMemberId:
      settlement.toMemberId,
    amount:
      settlement.amount,
    settlementDate:
      new Date(
        settlement.settlementDate
      ),
    sourceAccountId:
      settlement.sourceAccountId,
    destinationAccountId:
      settlement.destinationAccountId,
    applicationMethod:
      settlement.applicationMethod,
    referenceNumber:
      settlement.referenceNumber,
    notes:
      settlement.notes,
    attachments:
      settlement.attachments.map(
        (attachment) => ({
          ...attachment,
          createdAt: new Date(
            attachment.createdAt
          ),
        })
      ),
    isActive:
      settlement.isActive,
    createdAt:
      new Date(
        settlement.createdAt
      ),
    updatedAt:
      new Date(
        settlement.updatedAt
      ),
  };
}

function createRemoteSettlementDraft(
  form: SettlementForm,
  localRecordId?: string
): RemoteSettlementDraft {
  return {
    householdId:
      form.householdId.trim(),
    localRecordId:
      localRecordId ??
      crypto.randomUUID(),
    fromMemberId:
      form.fromMemberId.trim(),
    toMemberId:
      form.toMemberId.trim(),
    amount:
      Math.round(
        form.amount * 100
      ) / 100,
    settlementDate:
      form.settlementDate,
    sourceAccountId:
      form.sourceAccountId.trim() ||
      undefined,
    destinationAccountId:
      form.destinationAccountId.trim() ||
      undefined,
    applicationMethod:
      form.applicationMethod,
    referenceNumber:
      form.referenceNumber.trim() ||
      undefined,
    notes:
      form.notes.trim() ||
      undefined,
    attachments:
      form.attachments.map(
        (attachment) => ({
          ...attachment,
          createdAt: new Date(
            attachment.createdAt
          ),
        })
      ),
    isActive:
      form.isActive,
  };
}

function createRemoteApplicationDrafts(
  form: SettlementForm
): RemoteSettlementApplicationDraft[] {
  if (
    form.applicationMethod !==
    "manual"
  ) {
    return [];
  }

  return form.applications
    .filter(
      (application) =>
        application.isSelected &&
        application.appliedAmount > 0
    )
    .map((application) => ({
      localRecordId:
        crypto.randomUUID(),
      expenseAllocationId:
        application.expenseAllocationId,
      appliedAmount:
        application.appliedAmount,
    }));
}

export default function useSettlements(
  householdId: string,
  options: UseSettlementsOptions = {}
) {
  const remoteEnabled =
    options.remoteEnabled === true;

  const loadSettlements =
    useCallback((): Settlement[] => {
    if (!householdId.trim()) {
      return [];
    }

    return SettlementService
      .getActiveSettlementsByHouseholdId(
          householdId
      );
  }, [householdId]);

  const loadMemberBalances =
    useCallback((): MemberSettlementBalance[] => {
      if (!householdId.trim()) {
        return [];
      }

      return SettlementBalanceService
        .getMemberBalances(
          householdId
        );
    }, [householdId]);

  const loadObligations =
    useCallback((): MemberSettlementObligation[] => {
      if (!householdId.trim()) {
        return [];
      }

      return SettlementBalanceService
        .getWhoOwesWhom(
          householdId
        );
    }, [householdId]);

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

  const [error, setError] =
    useState("");

  /**
   * Reloads settlement records and all derived
   * balance calculations.
   */
  const refresh =
    useCallback(() => {
      setSettlements(
        loadSettlements()
      );

      setMemberBalances(
        loadMemberBalances()
      );

      setObligations(
        loadObligations()
      );
    }, [
      loadSettlements,
      loadMemberBalances,
      loadObligations,
    ]);

  const loadRemoteSettlements =
    useCallback(async () => {
      if (
        !remoteEnabled ||
        !householdId.trim()
      ) {
        return;
      }

      try {
        const remoteSettlements =
          await getAuthBackendAdapter()
            .listRemoteSettlements(
              householdId
            );

        setSettlements(
          sortSettlements(
            remoteSettlements
              .map(
                mapRemoteSettlement
              )
              .filter(
                (settlement) =>
                  settlement.isActive
              )
          )
        );

        setError("");
      } catch {
        setSettlements([]);
        setError(
          "Cloud settlements could not be loaded."
        );
      }
    }, [
      householdId,
      remoteEnabled,
    ]);

  useEffect(() => {
    if (remoteEnabled) {
      void loadRemoteSettlements();
      return;
    }

    refresh();
  }, [
    householdId,
    loadRemoteSettlements,
    refresh,
    remoteEnabled,
  ]);

  useEffect(() => {
    if (
      !remoteEnabled ||
      !householdId.trim()
    ) {
      return;
    }

    const adapter =
      getAuthBackendAdapter() as
        AuthSettlementObserver;
    const subscription =
      adapter
        .subscribeToSettlementChanges?.(
          householdId,
          () => {
            void loadRemoteSettlements();
          }
        );

    return () => {
      subscription?.unsubscribe();
    };
  }, [
    householdId,
    loadRemoteSettlements,
    remoteEnabled,
  ]);

  /**
   * Creates a settlement and refreshes all local
   * settlement and balance state after success.
   */
  const create = (
    form: SettlementForm
  ): Promise<
    OperationResult<Settlement>
  > => {
    if (remoteEnabled) {
      return createRemote(form);
    }

    const result =
      SettlementService.create(
        form
      );

    if (result.success) {
      refresh();
    }

    return Promise.resolve(
      result
    );
  };

  /**
   * Updates a settlement and refreshes all local
   * settlement and balance state after success.
   */
  const update = (
    id: string,
    form: SettlementForm
  ): Promise<
    OperationResult<Settlement>
  > => {
    if (remoteEnabled) {
      return updateRemote(
        id,
        form
      );
    }

    const result =
      SettlementService.update(
        id,
        form
      );

    if (result.success) {
      refresh();
    }

    return Promise.resolve(
      result
    );
  };

  /**
   * Deletes a settlement and refreshes all local
   * settlement and balance state after success.
   */
  const remove = (
    id: string
  ): Promise<
    OperationResult<boolean>
  > => {
    if (remoteEnabled) {
      return removeRemote(id);
    }

    const result =
      SettlementService.delete(
        id
      );

    if (result.success) {
      refresh();
    }

    return Promise.resolve(
      result
    );
  };

  const createRemote = async (
    form: SettlementForm
  ): Promise<
    OperationResult<Settlement>
  > => {
    const validation =
      SettlementValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        Settlement
      >(
        validation.errors,
        "Please correct the settlement validation errors."
      );
    }

    try {
      const result =
        await getAuthBackendAdapter()
          .createRemoteSettlement({
            settlement:
              createRemoteSettlementDraft(
                form
              ),
            applications:
              createRemoteApplicationDrafts(
                form
              ),
          });

      const settlement =
        mapRemoteSettlement(
          result.settlement
        );

      setSettlements((current) =>
        sortSettlements([
          settlement,
          ...current.filter(
            (item) =>
              item.id !==
              settlement.id
          ),
        ]).filter(
          (item) => item.isActive
        )
      );

      setError("");

      return OperationResults.success(
        settlement,
        "Settlement created successfully."
      );
    } catch (error) {
      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            error instanceof Error
              ? error.message
              : "Cloud settlement could not be saved.",
        },
        "Settlement was not saved."
      );
    }
  };

  const updateRemote = async (
    id: string,
    form: SettlementForm
  ): Promise<
    OperationResult<Settlement>
  > => {
    const validation =
      SettlementValidator.validate(
        form
      );

    if (!validation.isValid) {
      return OperationResults.failure<
        Settlement
      >(
        validation.errors,
        "Please correct the settlement validation errors."
      );
    }

    try {
      const result =
        await getAuthBackendAdapter()
          .updateRemoteSettlement({
            settlementId:
              id,
            settlement:
              createRemoteSettlementDraft(
                form,
                id
              ),
            applications:
              createRemoteApplicationDrafts(
                form
              ),
          });

      const settlement =
        mapRemoteSettlement(
          result.settlement
        );

      setSettlements((current) =>
        sortSettlements(
          current.map((item) =>
            item.id === id
              ? settlement
              : item
          )
        ).filter(
          (item) => item.isActive
        )
      );

      setError("");

      return OperationResults.success(
        settlement,
        "Settlement updated successfully."
      );
    } catch (error) {
      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            error instanceof Error
              ? error.message
              : "Cloud settlement could not be saved.",
        },
        "Settlement was not saved."
      );
    }
  };

  const removeRemote = async (
    id: string
  ): Promise<
    OperationResult<boolean>
  > => {
    try {
      await getAuthBackendAdapter()
        .deleteRemoteSettlement(
          householdId,
          id
        );

      setSettlements((current) =>
        current.filter(
          (settlement) =>
            settlement.id !== id
        )
      );

      setError("");

      return OperationResults.success(
        true,
        "Settlement deleted successfully."
      );
    } catch (error) {
      return OperationResults.failure<
        boolean
      >(
        {
          general:
            error instanceof Error
              ? error.message
              : "Cloud settlement could not be deleted.",
        },
        "Settlement was not deleted."
      );
    }
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
    error,

    create,
    update,
    remove,
    refresh,
  };
}
