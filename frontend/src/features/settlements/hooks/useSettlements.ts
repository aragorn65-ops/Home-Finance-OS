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
  RemoteSettlementDraft,
} from "../../auth/models";

import type { Settlement } from "../models/Settlement";
import type { SettlementForm } from "../models/SettlementForm";

import type { MemberSettlementBalance } from "../models/MemberSettlementBalance";

import type { MemberSettlementObligation } from "../models/MemberSettlementObligation";

import SettlementService from "../services/SettlementService";

import SettlementBalanceService from "../services/SettlementBalanceService";
import {
  createRemoteSettlementApplicationDrafts,
} from "../services/settlementRemoteDrafts";

import {
  OperationResults,
  type OperationResult,
} from "../../../shared/types";

interface UseSettlementsOptions {
  remoteEnabled?: boolean;
  localHouseholdId?: string;
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
  settlement: RemoteSettlement,
  localHouseholdId?: string
): Settlement {
  const localSettlement =
    settlement.localRecordId
      ? SettlementService
          .getSettlementById(
            settlement.localRecordId
          )
      : undefined;

  if (
    localSettlement &&
    (
      !localHouseholdId ||
      localSettlement.householdId ===
        localHouseholdId
    )
  ) {
    return localSettlement;
  }

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
  localRecordId?: string,
  householdIdOverride?: string
): RemoteSettlementDraft {
  return {
    householdId:
      householdIdOverride ??
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

function mergeSettlements(
  localSettlements: Settlement[],
  remoteSettlements: Settlement[]
): Settlement[] {
  const settlementById =
    new Map<string, Settlement>();

  for (const settlement of [
    ...remoteSettlements,
    ...localSettlements,
  ]) {
    settlementById.set(
      settlement.id,
      settlement
    );
  }

  return sortSettlements(
    [
      ...settlementById.values(),
    ].filter(
      (settlement) =>
        settlement.isActive
    )
  );
}

export default function useSettlements(
  householdId: string,
  options: UseSettlementsOptions = {}
) {
  const remoteEnabled =
    options.remoteEnabled === true;
  const localHouseholdId =
    options.localHouseholdId
      ?.trim() || householdId;

  const loadSettlements =
    useCallback((): Settlement[] => {
      if (!localHouseholdId.trim()) {
        return [];
      }

      return SettlementService
        .getActiveSettlementsByHouseholdId(
          localHouseholdId
        );
    }, [localHouseholdId]);

  const loadMemberBalances =
    useCallback((): MemberSettlementBalance[] => {
      if (!localHouseholdId.trim()) {
        return [];
      }

      return SettlementBalanceService
        .getMemberBalances(
          localHouseholdId
        );
    }, [localHouseholdId]);

  const loadObligations =
    useCallback((): MemberSettlementObligation[] => {
      if (!localHouseholdId.trim()) {
        return [];
      }

      return SettlementBalanceService
        .getWhoOwesWhom(
          localHouseholdId
        );
    }, [localHouseholdId]);

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
        const localSettlements =
          loadSettlements();
        const mappedRemoteSettlements =
          remoteSettlements.map(
            (settlement) =>
              mapRemoteSettlement(
                settlement,
                localHouseholdId
              )
          );

        setSettlements(
          mergeSettlements(
            localSettlements,
            mappedRemoteSettlements
          )
        );

        setError("");
      } catch {
        setSettlements(
          loadSettlements()
        );
        setError(
          "Cloud settlements could not be loaded."
        );
      }
    }, [
      householdId,
      localHouseholdId,
      loadSettlements,
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
    const localResult =
      SettlementService.create(
        form
      );

    if (!localResult.success) {
      return localResult;
    }

    const localSettlement =
      localResult.data;

    if (!localSettlement) {
      refresh();

      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            "Local settlement was not returned after save.",
        },
        "Settlement was not saved."
      );
    }

    try {
      const applications =
        createRemoteSettlementApplicationDrafts(
          SettlementService
            .getApplications(
              localSettlement.id
            )
        );

      await getAuthBackendAdapter()
        .createRemoteSettlement({
          settlement:
            createRemoteSettlementDraft(
              {
                ...form,
                householdId,
                sourceAccountId: "",
                destinationAccountId: "",
                applicationMethod:
                  "oldest-first",
                applications: [],
              },
              localSettlement.id,
              householdId
            ),
          applications,
        });

      refresh();
      setError("");

      return OperationResults.success(
        localSettlement,
        "Settlement created successfully."
      );
    } catch (error) {
      SettlementService.delete(
        localSettlement.id
      );
      refresh();

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
    const existingLocalSettlement =
      SettlementService.getSettlementById(
        id
      );
    const localResult =
      existingLocalSettlement
        ? SettlementService.update(
            id,
            form
          )
        : SettlementService.create(
            form
          );

    if (!localResult.success) {
      return localResult;
    }

    const localSettlement =
      localResult.data;

    if (!localSettlement) {
      refresh();

      return OperationResults.failure<
        Settlement
      >(
        {
          general:
            "Local settlement was not returned after update.",
        },
        "Settlement was not saved."
      );
    }

    try {
      const adapter =
        getAuthBackendAdapter();
      const remoteSettlements =
        await adapter.listRemoteSettlements(
          householdId
        );
      const remoteSettlement =
        remoteSettlements.find(
          (settlement) =>
            settlement.localRecordId ===
              id ||
            settlement.localRecordId ===
              localSettlement.id ||
            settlement.id === id
        );

      const remoteForm: SettlementForm = {
        ...form,
        householdId,
        sourceAccountId: "",
        destinationAccountId: "",
        applicationMethod:
          "oldest-first",
        applications: [],
      };
      const applications =
        createRemoteSettlementApplicationDrafts(
          SettlementService
            .getApplications(
              localSettlement.id
            )
        );

      if (remoteSettlement) {
        await adapter.updateRemoteSettlement({
          settlementId:
            remoteSettlement.id,
          settlement:
            createRemoteSettlementDraft(
              remoteForm,
              localSettlement.id,
              householdId
            ),
          applications,
        });
      } else {
        await adapter.createRemoteSettlement({
          settlement:
            createRemoteSettlementDraft(
              remoteForm,
              localSettlement.id,
              householdId
            ),
          applications,
        });
      }

      refresh();
      setError("");

      return OperationResults.success(
        localSettlement,
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
      const existingLocalSettlement =
        SettlementService.getSettlementById(
          id
        );
      const localResult =
        existingLocalSettlement
          ? SettlementService.delete(
              id
            )
          : OperationResults.success(
              true
            );

      if (!localResult.success) {
        return localResult;
      }

      const adapter =
        getAuthBackendAdapter();
      const remoteSettlements =
        await adapter.listRemoteSettlements(
          householdId
        );
      const remoteSettlement =
        remoteSettlements.find(
          (settlement) =>
            settlement.localRecordId ===
              id ||
            settlement.id === id
        );

      if (remoteSettlement) {
        await adapter.deleteRemoteSettlement(
          householdId,
          remoteSettlement.id
        );
      }

      refresh();

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
