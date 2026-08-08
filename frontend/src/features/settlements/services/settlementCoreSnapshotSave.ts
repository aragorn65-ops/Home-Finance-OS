import type {
  CurrentBrowserCoreSnapshotOptions,
} from "../../auth/services/coreSnapshotSync";
import {
  saveCurrentBrowserCoreSnapshotForHousehold,
} from "../../auth/services/coreSnapshotSync";

const adminOnlyCoreSnapshotMessage =
  /Only a household admin can save core finance records\./;

export function isCoreSnapshotAdminOnlyError(
  error: unknown
): boolean {
  return (
    error instanceof Error &&
    adminOnlyCoreSnapshotMessage.test(
      error.message
    )
  );
}

export async function saveSettlementCoreSnapshotIfAllowed(
  options: CurrentBrowserCoreSnapshotOptions
): Promise<"saved" | "skipped-admin-only"> {
  try {
    await saveCurrentBrowserCoreSnapshotForHousehold(
      options
    );

    return "saved";
  } catch (error) {
    if (isCoreSnapshotAdminOnlyError(error)) {
      return "skipped-admin-only";
    }

    throw error;
  }
}
