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

export function persistRemoteSettlementRecords(
  remoteSettlements: RemoteSettlement[],
  mappedSettlements: Settlement[],
  remoteApplications: RemoteSettlementApplication[]
): void {
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

      if (
        SettlementRepository.findById(
          mappedSettlement.id
        )
      ) {
        SettlementRepository.update(
          mappedSettlement
        );
        return;
      }

      SettlementRepository.create(
        mappedSettlement
      );
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

  mappedSettlements.forEach(
    (settlement) => {
      SettlementApplicationRepository
        .replaceBySettlementId(
          settlement.id,
          applicationsBySettlementId.get(
            settlement.id
          ) ?? []
        );
    }
  );
}
