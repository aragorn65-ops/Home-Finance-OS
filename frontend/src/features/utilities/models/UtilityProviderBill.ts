import type {
  StoredAttachment,
} from "../../../shared/models/StoredAttachment";

import type {
  TransactionVisibility,
} from "../../transactions/models/Transaction";

import type {
  UtilityType,
  UtilityUnit,
} from "../../transactions/models/UtilityMeter";

import type {
  UtilityApplianceUsageForm,
  UtilityMemberShareForm,
} from "./UtilityBillForm";

import type {
  UtilityBillShareResult,
  UtilityMemberShareResult,
} from "./UtilityBillShareResult";

export type UtilityProviderBillStatus =
  | "unpaid"
  | "paid";

export interface UtilityProviderBillFormSnapshot {
  utilityType: UtilityType;
  unit: UtilityUnit;

  providerName: string;
  billingDate: string;
  dueDate: string;

  totalBillAmount: number;
  ratePerUnit: number;
  totalConsumption: number;

  memberShares: UtilityMemberShareForm[];
  applianceUsages: UtilityApplianceUsageForm[];

  visibility: TransactionVisibility;
  description: string;
  notes: string;
}

export interface UtilityProviderBill {
  id: string;
  householdId: string;

  utilityType: UtilityType;
  unit: UtilityUnit;

  providerName: string;
  billingDate: Date;
  dueDate: Date;

  totalBillAmount: number;
  ratePerUnit: number;

  status: UtilityProviderBillStatus;

  formSnapshot: UtilityProviderBillFormSnapshot;
  calculationSnapshot: UtilityBillShareResult;
  memberShareSnapshot: UtilityMemberShareResult[];

  billAttachments: StoredAttachment[];
  paymentAttachments: StoredAttachment[];

  paidByMemberId: string;
  sourceAccountId: string;
  paidAt: Date | null;
  paymentReferenceNumber: string;
  transactionId: string;

  visibility: TransactionVisibility;
  description: string;
  notes: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
