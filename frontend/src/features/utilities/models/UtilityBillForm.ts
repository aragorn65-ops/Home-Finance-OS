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

/**
 * Member submeter and bill-share inputs.
 */
export interface UtilityMemberShareForm {
  memberId: string;

  /**
   * Optional saved submeter reference.
   */
  utilityMeterId: string;

  /**
   * Submeter readings may remain zero when the member
   * does not have a physical submeter.
   */
  previousReading: number;
  currentReading: number;

  isMeterReset: boolean;
  meterResetReason: string;

  /**
   * Actual billing-period usage when a reset or meter
   * replacement prevents reading subtraction.
   */
  resetUsageQuantity: number;

  /**
   * Additional direct amount assigned to this member.
   *
   * This compensates for usage or charges not captured
   * by the member's submeter or appliance records.
   */
  fixedCompensationAmount: number;

  /**
   * Determines whether this member participates in the
   * equal division of the remaining utility bill.
   *
   * Fixed compensation and equal sharing are mutually
   * exclusive.
   */
  sharesRemainder: boolean;
}

/**
 * Appliance usage assigned directly to one member.
 *
 * Appliance consumption:
 * powerKilowatts Ã— usageHours
 */
export interface UtilityApplianceUsageForm {
  memberId: string;

  applianceName: string;

  /**
   * Appliance power entered directly in kilowatts.
   */
  powerKilowatts: number;

  usageHours: number;

  notes: string;
}

/**
 * Complete bill-first utility input.
 */
export interface UtilityBillForm {
  utilityType: UtilityType;
  unit: UtilityUnit;

  /**
   * Date printed on or associated with the provider bill.
   */
  billingDate: string;

  /**
   * Actual amount payable to the utility provider.
   */
  totalBillAmount: number;

  /**
   * Monthly utility rate entered manually from the
   * provider bill.
   */
  ratePerUnit: number;

  memberShares: UtilityMemberShareForm[];

  applianceUsages: UtilityApplianceUsageForm[];

  /**
   * Household member who paid the provider bill.
   */
  paidByMemberId: string;

  /**
   * Optional payment account.
   *
   * Leave empty to record the utility expense without
   * changing an account balance.
   */
  sourceAccountId: string;

  visibility: TransactionVisibility;

  description: string;
  notes: string;

  /**
   * Locally stored provider bills, receipts, or supporting
   * documents attached to the generated transaction.
   */
  attachments: StoredAttachment[];

  transactionDate: string;
  isActive: boolean;
}

export const defaultUtilityBillForm:
  UtilityBillForm = {
    utilityType: "electricity",
    unit: "kWh",

    billingDate: "",

    totalBillAmount: 0,
    ratePerUnit: 0,

    memberShares: [],

    applianceUsages: [],

    paidByMemberId: "",
    sourceAccountId: "",

    visibility: "household",

    description: "",
    notes: "",

    attachments: [],

    transactionDate: "",
    isActive: true,
  };
