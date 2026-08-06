import type {
  Account,
} from "../../accounts/models/Account";
import type {
  Transaction,
} from "../../transactions/models/Transaction";
import type {
  ExpenseAllocation,
} from "../../transactions/models/ExpenseAllocation";
import type {
  UtilityProviderBill,
} from "../../utilities/models/UtilityProviderBill";
import type {
  RemoteHouseholdCoreSnapshot,
  RemoteHouseholdCoreSnapshotInput,
} from "../models";

import type {
  AuthBackendAdapter,
} from "./AuthBackendAdapter";
import {
  createMigrationAccountUploadPayload,
  createMigrationExpenseAllocationUploadRecords,
  createMigrationTransactionUploadPayload,
} from "./remoteMigrationUploadPayloads";

export interface LocalCoreSnapshotSource {
  householdId: string;
  localHouseholdId?: string;
  accounts: Account[];
  transactions: Transaction[];
  expenseAllocations?: ExpenseAllocation[];
  providerBills?: UtilityProviderBill[];
}

export interface CoreSnapshotRecordSource {
  getAccounts(): Account[];
  getTransactions(): Transaction[];
  getExpenseAllocations?(): ExpenseAllocation[];
  getProviderBills?(): UtilityProviderBill[];
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
    ownerMemberId?: string;
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

export interface CoreSnapshotLocalWriter {
  replaceAccounts(
    householdId: string,
    accounts: Account[]
  ): boolean;
  replaceTransactions(
    householdId: string,
    transactions: Transaction[]
  ): boolean;
  replaceExpenseAllocations?(
    householdId: string,
    allocations: ExpenseAllocation[]
  ): boolean;
  replaceProviderBills?(
    householdId: string,
    providerBills: UtilityProviderBill[]
  ): boolean;
}

export interface ApplyRemoteCoreSnapshotOptions {
  snapshot: RemoteHouseholdCoreSnapshot;
  localHouseholdId: string;
  ownerMemberId: string;
  writer: CoreSnapshotLocalWriter;
}

export interface LinkedCoreSnapshotRestoreOptions {
  authEnabled: boolean;
  household:
    | LinkedCoreSnapshotHousehold
    | null
    | undefined;
  adapter: CoreSnapshotAdapter;
  writer: CoreSnapshotLocalWriter;
}

export type LinkedCoreSnapshotRestoreResult =
  | {
      status: "skipped";
      reason:
        | "auth-disabled"
        | "missing-household"
        | "unlinked-household"
        | "missing-owner-member";
    }
  | {
      status: "restored";
      snapshot: RemoteHouseholdCoreSnapshot;
      accountCount: number;
      transactionCount: number;
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
  const expenseAllocations =
    createMigrationExpenseAllocationUploadRecords(
      source.expenseAllocations ?? [],
      transactionPayload.transactions.map(
        (transaction) =>
          transaction.id
      )
    );

  return {
    householdId:
      source.householdId,
    accounts:
      accountPayload.accounts,
    transactions:
      transactionPayload.transactions,
    expenseAllocations,
    providerBills:
      (source.providerBills ?? [])
        .filter(
          (providerBill) =>
            providerBill.householdId ===
            localHouseholdId
        )
        .map((providerBill) => ({
          ...providerBill,
          householdId:
            source.householdId,
          billingDate:
            new Date(
              providerBill.billingDate
            ),
          dueDate:
            new Date(
              providerBill.dueDate
            ),
          paidAt:
            providerBill.paidAt
              ? new Date(
                  providerBill.paidAt
                )
              : null,
          createdAt:
            new Date(
              providerBill.createdAt
            ),
          updatedAt:
            new Date(
              providerBill.updatedAt
            ),
        })),
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
      expenseAllocations:
        options.recordSource
          .getExpenseAllocations?.() ?? [],
      providerBills:
        options.recordSource
          .getProviderBills?.() ?? [],
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

export function applyRemoteCoreSnapshotToLocalHousehold(
  options: ApplyRemoteCoreSnapshotOptions
): {
  accountCount: number;
  transactionCount: number;
} {
  const accounts =
    options.snapshot.accounts.map(
      (account) => ({
        ...account,
        householdId:
          options.localHouseholdId,
        ownerMemberId:
          account.ownerMemberId ??
          options.ownerMemberId,
        paymentDueDate:
          account.paymentDueDate
            ? parseDateOnly(
                account.paymentDueDate
              )
            : undefined,
        exchangeRateEffectiveDate:
          account.exchangeRateEffectiveDate
            ? parseDateOnly(
                account.exchangeRateEffectiveDate
              )
            : undefined,
        createdAt:
          new Date(account.createdAt),
        updatedAt:
          new Date(account.updatedAt),
      })
    );

  const transactions =
    options.snapshot.transactions.map(
      (transaction) => ({
        ...transaction,
        householdId:
          options.localHouseholdId,
        createdByMemberId:
          transaction.createdByMemberId ??
          undefined,
        paidByMemberId:
          transaction.paidByMemberId ??
          undefined,
        transactionDate:
          parseDateOnly(
            transaction.transactionDate
          ),
        exchangeRateEffectiveDate:
          transaction.exchangeRateEffectiveDate
            ? parseDateOnly(
                transaction.exchangeRateEffectiveDate
              )
            : undefined,
        attachments:
          transaction.attachments?.map(
            (attachment) => ({
              ...attachment,
              createdAt:
                new Date(
                  attachment.createdAt
                ),
            })
          ) ?? [],
        createdAt:
          new Date(transaction.createdAt),
        updatedAt:
          new Date(transaction.updatedAt),
      })
    );
  const expenseAllocations =
    (options.snapshot.expenseAllocations ?? []).map(
      (allocation) => ({
        ...allocation,
        createdAt:
          new Date(allocation.createdAt),
        updatedAt:
          new Date(allocation.updatedAt),
      })
    );
  const shouldReplaceExpenseAllocations =
    Array.isArray(
      options.snapshot.expenseAllocations
    ) &&
    (
      expenseAllocations.length > 0 ||
      transactions.length === 0
    );
  const providerBills =
    (options.snapshot.providerBills ?? []).map(
      (providerBill) => ({
        ...providerBill,
        householdId:
          options.localHouseholdId,
        billingDate:
          new Date(
            providerBill.billingDate
          ),
        dueDate:
          new Date(
            providerBill.dueDate
          ),
        paidAt:
          providerBill.paidAt
            ? new Date(
                providerBill.paidAt
              )
            : null,
        createdAt:
          new Date(
            providerBill.createdAt
          ),
        updatedAt:
          new Date(
            providerBill.updatedAt
          ),
        billAttachments:
          providerBill.billAttachments.map(
            (attachment) => ({
              ...attachment,
              createdAt:
                new Date(
                  attachment.createdAt
                ),
            })
          ),
        paymentAttachments:
          providerBill.paymentAttachments.map(
            (attachment) => ({
              ...attachment,
              createdAt:
                new Date(
                  attachment.createdAt
                ),
            })
          ),
      })
    );

  if (
    !options.writer.replaceAccounts(
      options.localHouseholdId,
      accounts
    )
  ) {
    throw new Error(
      "Local accounts could not be replaced from the cloud snapshot."
    );
  }

  if (
    !options.writer.replaceTransactions(
      options.localHouseholdId,
      transactions
    )
  ) {
    throw new Error(
      "Local transactions could not be replaced from the cloud snapshot."
    );
  }

  if (
    options.writer.replaceExpenseAllocations &&
    shouldReplaceExpenseAllocations &&
    !options.writer.replaceExpenseAllocations(
      options.localHouseholdId,
      expenseAllocations
    )
  ) {
    throw new Error(
      "Local expense allocations could not be replaced from the cloud snapshot."
    );
  }

  if (
    options.writer.replaceProviderBills &&
    Array.isArray(
      options.snapshot.providerBills
    ) &&
    !options.writer.replaceProviderBills(
      options.localHouseholdId,
      providerBills
    )
  ) {
    throw new Error(
      "Local utility provider bills could not be replaced from the cloud snapshot."
    );
  }

  return {
    accountCount:
      accounts.length,
    transactionCount:
      transactions.length,
  };
}

function parseDateOnly(
  value: string
): Date {
  return new Date(
    `${value}T00:00:00.000Z`
  );
}

export async function restoreLinkedRemoteCoreSnapshot(
  options: LinkedCoreSnapshotRestoreOptions
): Promise<LinkedCoreSnapshotRestoreResult> {
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

  const ownerMemberId =
    options.household.authenticatedLink
      ?.ownerMemberId;

  if (!ownerMemberId) {
    return {
      status: "skipped",
      reason: "missing-owner-member",
    };
  }

  const snapshot =
    await loadRemoteCoreSnapshotForHousehold(
      options.adapter,
      remoteHouseholdId
    );

  const counts =
    applyRemoteCoreSnapshotToLocalHousehold({
      snapshot,
      localHouseholdId:
        options.household.id,
      ownerMemberId,
      writer:
        options.writer,
    });

  return {
    status: "restored",
    snapshot,
    ...counts,
  };
}
