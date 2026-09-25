import AccountRepository from "../../accounts/repositories/AccountRepository";
import TransactionRepository from "../../transactions/repositories/TransactionRepository";
import ExpenseAllocationRepository from "../../transactions/repositories/ExpenseAllocationRepository";
import UtilityProviderBillRepository from "../../utilities/repositories/UtilityProviderBillRepository";
import type { StoredAttachment } from "../../../shared/models/StoredAttachment";

import type {
  CoreSnapshotLocalWriter,
} from "./coreSnapshotSync";

export const browserCoreSnapshotLocalWriter:
  CoreSnapshotLocalWriter = {
  replaceAccounts(
    householdId,
    accounts
  ) {
    const localAccounts =
      AccountRepository
        .findAll()
        .filter(
          (account) =>
            account.householdId ===
            householdId
        );

    if (
      accounts.length === 0 &&
      localAccounts.length > 0
    ) {
      return true;
    }

    const remoteAccountIds =
      new Set(
        accounts.map(
          (account) => account.id
        )
      );
    const localPersonalAccounts =
      localAccounts.filter(
        (account) =>
            account.visibility ===
              "private" &&
            !remoteAccountIds.has(
              account.id
            )
      );

    return AccountRepository
      .replaceForHousehold(
        householdId,
        [
          ...accounts,
          ...localPersonalAccounts,
        ]
      );
  },

  replaceTransactions(
    householdId,
    transactions
  ) {
    const localTransactions = new Map(
      TransactionRepository.findAll()
        .filter((transaction) => transaction.householdId === householdId)
        .map((transaction) => [transaction.id, transaction])
    );
    return TransactionRepository
      .replaceForHousehold(
        householdId,
        transactions.map((transaction) => {
          const local = localTransactions.get(transaction.id);
          return {
            ...transaction,
            // Cloud metadata is not a deletion of file bytes held by this browser.
            // Only retain content for attachments still listed on the same record.
            attachments: transaction.attachments?.map((attachment) =>
              retainLocalAttachmentContent(attachment, local?.attachments)
            ),
          };
        })
      );
  },

  replaceExpenseAllocations(
    householdId,
    allocations
  ) {
    return ExpenseAllocationRepository
      .replaceForHousehold(
        householdId,
        allocations
      );
  },

  replaceProviderBills(
    householdId,
    providerBills
  ) {
    const localBills = new Map(
      UtilityProviderBillRepository.findAll()
        .filter((bill) => bill.householdId === householdId)
        .map((bill) => [bill.id, bill])
    );
    return UtilityProviderBillRepository
      .replaceForHousehold(
        householdId,
        providerBills.map((bill) => {
          const local = localBills.get(bill.id);
          return {
            ...bill,
            billAttachments: bill.billAttachments.map((attachment) =>
              retainLocalAttachmentContent(attachment, local?.billAttachments)),
            paymentAttachments: bill.paymentAttachments.map((attachment) =>
              retainLocalAttachmentContent(attachment, local?.paymentAttachments)),
          };
        })
      );
  },
};

function retainLocalAttachmentContent(
  attachment: StoredAttachment,
  localAttachments: StoredAttachment[] = []
): StoredAttachment {
  if (attachment.dataUrl.trim()) return attachment;
  const existing = localAttachments.find((candidate) =>
    candidate.id === attachment.id && candidate.fileName === attachment.fileName &&
    candidate.mimeType === attachment.mimeType && candidate.sizeBytes === attachment.sizeBytes &&
    new Date(candidate.createdAt).getTime() === new Date(attachment.createdAt).getTime()
  );
  return existing?.dataUrl.trim() ? { ...attachment, dataUrl: existing.dataUrl } : attachment;
}
