import type {
  RemoteSettlementApplicationDraft,
} from "../../auth/models";

import type {
  SettlementApplication,
} from "../models/SettlementApplication";

export function createRemoteSettlementApplicationDrafts(
  applications: SettlementApplication[]
): RemoteSettlementApplicationDraft[] {
  return applications.map(
    (application) => ({
      localRecordId:
        application.id,
      expenseAllocationId:
        application.expenseAllocationId,
      appliedAmount:
        application.appliedAmount,
    })
  );
}
