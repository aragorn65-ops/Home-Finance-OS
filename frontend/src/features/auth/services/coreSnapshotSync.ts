import type {
  Account,
} from "../../accounts/models/Account";
import type {
  Transaction,
} from "../../transactions/models/Transaction";
import type {
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
} from "../models";

import type {
  AuthBackendAdapter,
} from "./AuthBackendAdapter";
import {
  createMigrationAccountUploadPayload,
  createMigrationTransactionUploadPayload,
} from "./remoteMigrationUploadPayloads";

export interface LocalCoreSnapshotSource {
  householdId: string;
  localHouseholdId?: string;
  accounts: Account[];
  transactions: Transaction[];
}

export interface CoreSnapshotRecordSource {
  getAccounts(): Account[];
  getTransactions(): Transaction[];
}

export interface CurrentBrowserCoreSnapshotOptions {
  adapter: CoreSnapshotAdapter;
  householdId: string;
  localHouseholdId?: string;
  recordSource: CoreSnapshotRecordSource;
}

export interface LinkedCoreSnapshotHousehold {
  id: string;
  authenticatedLink?: {
    remoteHouseholdId: string;
  };
}

export interface LinkedCoreSnapshotSaveOptions {
  authEnabled: boolean;
  household:
    | LinkedCoreSnapshotHousehold
    | null
    | undefined;
  adapter: CoreSnapshotAdapter;
  recordSource: CoreSnapshotRecordSource;
}

export type LinkedCoreSnapshotSaveResult =
  | {
      status: "skipped";
      reason:
        | "auth-disabled"
        | "missing-household"
        | "unlinked-household";
    }
  | {
      status: "saved";
      snapshot: RemoteHouseholdCoreSnapshot;
    };

export interface LocalCoreSnapshotCounts {
  accountCount: number;
  transactionCount: number;
}

export type CoreSnapshotAdapter =
  Pick<
    AuthBackendAdapter,
    | "loadRemoteCoreSnapshot"
    | "saveRemoteCoreSnapshot"
  >;

export function createRemoteCoreSnapshotInput(
  source: LocalCoreSnapshotSource
): RemoteHouseholdCoreSnapshotInput {
  const localHouseholdId =
    source.localHouseholdId ??
    source.householdId;
  const accountPayload =
    createMigrationAccountUploadPayload(
      source.accounts,
      localHouseholdId
    );
  const transactionPayload =
    createMigrationTransactionUploadPayload(
      source.transactions,
      localHouseholdId
    );

  return {
    householdId:
      source.householdId,
    accounts:
      accountPayload.accounts,
    transactions:
      transactionPayload.transactions,
  };
}

export function getLocalCoreSnapshotCounts(
  localHouseholdId: string,
  recordSource: CoreSnapshotRecordSource
): LocalCoreSnapshotCounts {
  return {
    accountCount:
      recordSource
        .getAccounts()
        .filter(
          (account) =>
            account.householdId ===
            localHouseholdId
        ).length,
    transactionCount:
      recordSource
        .getTransactions()
        .filter(
          (transaction) =>
            transaction.householdId ===
            localHouseholdId
        ).length,
  };
}

export async function saveRemoteCoreSnapshotForHousehold(
  adapter: CoreSnapshotAdapter,
  source: LocalCoreSnapshotSource
): Promise<RemoteHouseholdCoreSnapshot> {
  return adapter.saveRemoteCoreSnapshot(
    createRemoteCoreSnapshotInput(source)
  );
}

export async function saveCurrentBrowserCoreSnapshotForHousehold(
  options: CurrentBrowserCoreSnapshotOptions
): Promise<RemoteHouseholdCoreSnapshot> {
  return saveRemoteCoreSnapshotForHousehold(
    options.adapter,
    {
      householdId:
        options.householdId,
      localHouseholdId:
        options.localHouseholdId,
      accounts:
        options.recordSource
          .getAccounts(),
      transactions:
        options.recordSource
          .getTransactions(),
    }
  );
}

export async function saveLinkedRemoteCoreSnapshot(
  options: LinkedCoreSnapshotSaveOptions
): Promise<LinkedCoreSnapshotSaveResult> {
  if (!options.authEnabled) {
    return {
      status: "skipped",
      reason: "auth-disabled",
    };
  }

  if (!options.household) {
    return {
      status: "skipped",
      reason: "missing-household",
    };
  }

  const remoteHouseholdId =
    options.household.authenticatedLink
      ?.remoteHouseholdId;

  if (!remoteHouseholdId) {
    return {
      status: "skipped",
      reason: "unlinked-household",
    };
  }

  return {
    status: "saved",
    snapshot:
      await saveCurrentBrowserCoreSnapshotForHousehold({
        adapter:
          options.adapter,
        householdId:
          remoteHouseholdId,
        localHouseholdId:
          options.household.id,
        recordSource:
          options.recordSource,
      }),
  };
}

export async function loadRemoteCoreSnapshotForHousehold(
  adapter: CoreSnapshotAdapter,
  householdId: string
): Promise<RemoteHouseholdCoreSnapshot> {
  return adapter.loadRemoteCoreSnapshot(
    householdId
  );
}
