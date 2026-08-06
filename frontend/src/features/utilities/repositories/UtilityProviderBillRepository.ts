import type {
  StoredAttachment,
} from "../../../shared/models/StoredAttachment";

import {
  HFOS_STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from "../../../shared/storage/localStorageStore";

import type {
  UtilityProviderBill,
} from "../models/UtilityProviderBill";

type SerializedStoredAttachment =
  Omit<StoredAttachment, "createdAt"> & {
    createdAt: string;
  };

type SerializedUtilityProviderBill =
  Omit<
    UtilityProviderBill,
    | "billingDate"
    | "dueDate"
    | "billAttachments"
    | "paymentAttachments"
    | "paidAt"
    | "createdAt"
    | "updatedAt"
  > & {
    billingDate: string;
    dueDate: string;
    billAttachments: SerializedStoredAttachment[];
    paymentAttachments: SerializedStoredAttachment[];
    paidAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

export default class UtilityProviderBillRepository {
  private static providerBills:
    UtilityProviderBill[] = [];

  private static isInitialized =
    false;

  static findAll():
    UtilityProviderBill[] {
    this.ensureInitialized();

    return this.providerBills.map(
      (providerBill) =>
        this.clone(providerBill)
    );
  }

  static findActiveByHouseholdId(
    householdId: string
  ): UtilityProviderBill[] {
    this.ensureInitialized();

    return this.providerBills
      .filter(
        (providerBill) =>
          providerBill.householdId ===
            householdId &&
          providerBill.isActive
      )
      .map(
        (providerBill) =>
          this.clone(providerBill)
      );
  }

  static findById(
    id: string
  ): UtilityProviderBill | undefined {
    this.ensureInitialized();

    const providerBill =
      this.providerBills.find(
        (item) => item.id === id
      );

    return providerBill
      ? this.clone(providerBill)
      : undefined;
  }

  static create(
    providerBill:
      UtilityProviderBill
  ): UtilityProviderBill {
    this.ensureInitialized();

    this.providerBills = [
      ...this.providerBills,
      this.clone(providerBill),
    ];

    this.persist();

    return this.clone(providerBill);
  }

  static update(
    providerBill:
      UtilityProviderBill
  ): UtilityProviderBill {
    this.ensureInitialized();

    this.providerBills =
      this.providerBills.map((item) =>
        item.id === providerBill.id
          ? this.clone(providerBill)
          : item
      );

    this.persist();

    return this.clone(providerBill);
  }

  static replaceForHousehold(
    householdId: string,
    providerBills:
      UtilityProviderBill[]
  ): boolean {
    this.ensureInitialized();

    this.providerBills = [
      ...this.providerBills.filter(
        (providerBill) =>
          providerBill.householdId !==
          householdId
      ),
      ...providerBills.map(
        (providerBill) =>
          this.clone({
            ...providerBill,
            householdId,
          })
      ),
    ];

    this.persist();

    return true;
  }

  private static ensureInitialized():
    void {
    if (this.isInitialized) {
      return;
    }

    const loadResult =
      loadStoredData<
        SerializedUtilityProviderBill[]
      >(
        HFOS_STORAGE_KEYS.providerBills,
        isSerializedUtilityProviderBillArray
      );

    if (loadResult.status === "loaded") {
      this.providerBills =
        loadResult.data?.map(
          deserializeProviderBill
        ) ?? [];
    } else if (
      loadResult.status === "missing"
    ) {
      this.providerBills = [];
      this.persist();
    } else {
      this.providerBills = [];
    }

    this.isInitialized = true;
  }

  private static persist(): void {
    saveStoredData(
      HFOS_STORAGE_KEYS.providerBills,
      this.providerBills.map(
        serializeProviderBill
      )
    );
  }

  private static clone(
    providerBill:
      UtilityProviderBill
  ): UtilityProviderBill {
    return {
      ...providerBill,
      billingDate:
        new Date(
          providerBill.billingDate
        ),
      dueDate:
        new Date(
          providerBill.dueDate
        ),
      formSnapshot: {
        ...providerBill.formSnapshot,
        memberShares:
          providerBill.formSnapshot.memberShares.map(
            (memberShare) => ({
              ...memberShare,
            })
          ),
        applianceUsages:
          providerBill.formSnapshot.applianceUsages.map(
            (usage) => ({
              ...usage,
            })
          ),
      },
      calculationSnapshot: {
        ...providerBill.calculationSnapshot,
        memberShares:
          providerBill.calculationSnapshot.memberShares.map(
            (memberShare) => ({
              ...memberShare,
            })
          ),
      },
      memberShareSnapshot:
        providerBill.memberShareSnapshot.map(
          (memberShare) => ({
            ...memberShare,
          })
        ),
      billAttachments:
        providerBill.billAttachments.map(
          cloneAttachment
        ),
      paymentAttachments:
        providerBill.paymentAttachments.map(
          cloneAttachment
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
    };
  }
}

function serializeProviderBill(
  providerBill:
    UtilityProviderBill
): SerializedUtilityProviderBill {
  return {
    ...providerBill,
    billingDate:
      providerBill.billingDate.toISOString(),
    dueDate:
      providerBill.dueDate.toISOString(),
    billAttachments:
      providerBill.billAttachments.map(
        serializeAttachment
      ),
    paymentAttachments:
      providerBill.paymentAttachments.map(
        serializeAttachment
      ),
    paidAt:
      providerBill.paidAt
        ? providerBill.paidAt.toISOString()
        : null,
    createdAt:
      providerBill.createdAt.toISOString(),
    updatedAt:
      providerBill.updatedAt.toISOString(),
  };
}

function deserializeProviderBill(
  providerBill:
    SerializedUtilityProviderBill
): UtilityProviderBill {
  return {
    ...providerBill,
    billingDate:
      new Date(
        providerBill.billingDate
      ),
    dueDate:
      new Date(
        providerBill.dueDate
      ),
    billAttachments:
      providerBill.billAttachments.map(
        deserializeAttachment
      ),
    paymentAttachments:
      providerBill.paymentAttachments.map(
        deserializeAttachment
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
  };
}

function serializeAttachment(
  attachment: StoredAttachment
): SerializedStoredAttachment {
  return {
    ...attachment,
    createdAt:
      attachment.createdAt.toISOString(),
  };
}

function deserializeAttachment(
  attachment:
    SerializedStoredAttachment
): StoredAttachment {
  return {
    ...attachment,
    createdAt:
      new Date(
        attachment.createdAt
      ),
  };
}

function cloneAttachment(
  attachment: StoredAttachment
): StoredAttachment {
  return {
    ...attachment,
    createdAt:
      new Date(
        attachment.createdAt
      ),
  };
}

function isSerializedUtilityProviderBillArray(
  value: unknown
): value is SerializedUtilityProviderBill[] {
  return (
    Array.isArray(value) &&
    value.every(isSerializedUtilityProviderBill)
  );
}

function isSerializedUtilityProviderBill(
  value: unknown
): value is SerializedUtilityProviderBill {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.householdId ===
      "string" &&
    typeof value.utilityType ===
      "string" &&
    typeof value.unit === "string" &&
    typeof value.providerName ===
      "string" &&
    isDateString(value.billingDate) &&
    isDateString(value.dueDate) &&
    typeof value.totalBillAmount ===
      "number" &&
    typeof value.ratePerUnit ===
      "number" &&
    (
      value.status === "unpaid" ||
      value.status === "paid"
    ) &&
    isRecord(value.formSnapshot) &&
    isRecord(value.calculationSnapshot) &&
    Array.isArray(value.memberShareSnapshot) &&
    Array.isArray(value.billAttachments) &&
    Array.isArray(value.paymentAttachments) &&
    (
      value.paidAt === null ||
      isDateString(value.paidAt)
    ) &&
    typeof value.isActive ===
      "boolean" &&
    isDateString(value.createdAt) &&
    isDateString(value.updatedAt)
  );
}

function isDateString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(
      new Date(value).getTime()
    )
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}
