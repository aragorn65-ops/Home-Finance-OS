import type {
  RemoteSettlement,
  RemoteSettlementApplication,
} from "../../auth/models";

import type { Settlement } from "../models/Settlement";
import type {
  SettlementApplication,
} from "../models/SettlementApplication";

import SettlementRepository from "../repositories/SettlementRepository";
import SettlementApplicationRepository from "../repositories/SettlementApplicationRepository";
import { HFOS_STORAGE_KEYS, saveStoredDataBatch } from "../../../shared/storage/localStorageStore";
import { loadHousehold } from "../../household/services/householdStorage";
import type { AuthBackendAdapter } from "../../auth/services/AuthBackendAdapter";
import { stageAttachmentRecords } from "../../../shared/storage/attachmentContentStore";

export function mapRemoteSettlement(settlement: RemoteSettlement, localHouseholdId?: string): Settlement {
  return {
    id: settlement.localRecordId ?? settlement.id,
    householdId: localHouseholdId ?? settlement.householdId,
    fromMemberId: settlement.fromMemberId,
    toMemberId: settlement.toMemberId,
    amount: settlement.amount,
    sourceAccountId: settlement.sourceAccountId,
    destinationAccountId: settlement.destinationAccountId,
    applicationMethod: settlement.applicationMethod,
    referenceNumber: settlement.referenceNumber,
    notes: settlement.notes,
    isActive: settlement.isActive,
    settlementDate: new Date(settlement.settlementDate),
    createdAt: new Date(settlement.createdAt),
    updatedAt: new Date(settlement.updatedAt),
    attachments: settlement.attachments.map((attachment) => ({
      ...attachment, createdAt: new Date(attachment.createdAt),
    })),
  };
}

export async function refreshRemoteSettlementCache(
  adapter: Pick<AuthBackendAdapter, "listRemoteSettlements" | "listRemoteSettlementApplications">,
  remoteHouseholdId: string,
  localHouseholdId: string,
  isCurrent: () => boolean
): Promise<boolean> {
  if (!isCurrent()) return false;
  const [settlements, applications] = await Promise.all([
    adapter.listRemoteSettlements(remoteHouseholdId),
    adapter.listRemoteSettlementApplications(remoteHouseholdId),
  ]);
  if (!isCurrent()) return false;
  const mapped = settlements.map((settlement) => mapRemoteSettlement(settlement, localHouseholdId));
  await stageAttachmentRecords(mapped);
  if (!isCurrent()) return false;
  persistRemoteSettlementRecords(localHouseholdId, settlements, mapped, applications);
  return true;
}

export function persistRemoteSettlementRecords(
  localHouseholdId: string,
  remoteSettlements: RemoteSettlement[],
  mappedSettlements: Settlement[],
  remoteApplications: RemoteSettlementApplication[]
): void {
  if (loadHousehold()?.id !== localHouseholdId ||
      mappedSettlements.some((settlement) => settlement.householdId !== localHouseholdId) ||
      mappedSettlements.length !== remoteSettlements.length ||
      new Set(mappedSettlements.map((settlement) => settlement.id)).size !== mappedSettlements.length) {
    throw new Error("Settlement refresh did not match the active household. Cached payments were preserved.");
  }
  const existingApplicationsBySettlementId =
    new Map<string, SettlementApplication[]>();

  SettlementRepository
    .findByHouseholdId(
      localHouseholdId
    )
    .forEach((settlement) => {
      existingApplicationsBySettlementId.set(
        settlement.id,
        SettlementApplicationRepository.findBySettlementId(
          settlement.id
        )
      );

    });

  const localSettlementIdByRemoteId =
    new Map<string, string>();

  remoteSettlements.forEach(
    (remoteSettlement, index) => {
      const mappedSettlement =
        mappedSettlements[index];

      if (!mappedSettlement) {
        return;
      }

      localSettlementIdByRemoteId.set(
        remoteSettlement.id,
        mappedSettlement.id
      );

      if (
        remoteSettlement.localRecordId
      ) {
        localSettlementIdByRemoteId.set(
          remoteSettlement.localRecordId,
          mappedSettlement.id
        );
      }

    }
  );

  const applicationsBySettlementId =
    new Map<
      string,
      SettlementApplication[]
    >();

  for (const application of remoteApplications) {
    const settlementId =
      localSettlementIdByRemoteId.get(
        application.settlementId
      ) ?? application.settlementId;

    const mappedApplication: SettlementApplication =
      {
        id:
          application.localRecordId ??
          application.id,
        settlementId,
        expenseAllocationId:
          application.expenseAllocationId,
        appliedAmount:
          application.appliedAmount,
        createdAt:
          new Date(
            application.createdAt
          ),
        updatedAt:
          new Date(
            application.updatedAt
          ),
      };

    const applications =
      applicationsBySettlementId.get(
        settlementId
      ) ?? [];

    applications.push(
      mappedApplication
    );
    applicationsBySettlementId.set(
      settlementId,
      applications
    );
  }

  const nextApplications: SettlementApplication[] = [];
  mappedSettlements.forEach(
    (settlement) => {
      const remoteSettlementApplications =
        applicationsBySettlementId.get(
          settlement.id
        );
      const preservedApplications =
        existingApplicationsBySettlementId.get(
          settlement.id
        ) ?? [];

      nextApplications.push(...(remoteSettlementApplications ?? preservedApplications));
    }
  );

  if (new Set(nextApplications.map((application) => application.id)).size !== nextApplications.length) {
    throw new Error("Settlement refresh contained duplicate payment links. Cached payments were preserved.");
  }
  // Persist both complete collections before changing either in-memory repository.
  // A failed write restores the previous storage values instead of deleting payments.
  const saved = saveStoredDataBatch([
    { key: HFOS_STORAGE_KEYS.settlements, data: mappedSettlements },
    { key: HFOS_STORAGE_KEYS.settlementApplications, data: nextApplications },
  ]);
  if (!saved.success) throw new Error(saved.message ?? "Settlement cache could not be saved.");
  SettlementRepository.reloadFromStorage();
  SettlementApplicationRepository.reloadFromStorage();
}
