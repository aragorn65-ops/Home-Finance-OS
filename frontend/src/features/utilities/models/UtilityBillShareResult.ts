import type {
  UtilityType,
  UtilityUnit,
} from "../../transactions/models/UtilityMeter";

/**
 * Final calculated utility share for one household member.
 */
export interface UtilityMemberShareResult {
  memberId: string;

  /**
   * Whether the member participates in the equal division
   * of the bill remaining after direct usage amounts.
   */
  sharesRemainder: boolean;

  /**
   * Consumption measured through the member's submeter.
   */
  submeterConsumption: number;

  /**
   * Monetary charge for submeter consumption.
   *
   * submeterConsumption × ratePerUnit
   */
  submeterChargeAmount: number;

  /**
   * Total appliance consumption assigned to the member.
   *
   * powerKilowatts × usageHours × usageFactor
   */
  applianceConsumption: number;

  /**
   * Monetary charge for assigned appliance consumption.
   *
   * applianceConsumption × ratePerUnit
   */
  applianceChargeAmount: number;

  /**
   * Additional direct amount assigned to the member for
   * usage or charges not captured by meters or appliance
   * records.
   */
  fixedCompensationAmount: number;

  /**
   * Complete direct usage amount assigned to the member.
   *
   * submeterChargeAmount
   * + applianceChargeAmount
   * + fixedCompensationAmount
   */
  directUsageAmount: number;

  /**
   * Member's portion of the remaining bill.
   *
   * This is zero when sharesRemainder is false.
   */
  equalSharedAmount: number;

  /**
   * Final amount owed by the member.
   *
   * directUsageAmount + equalSharedAmount
   */
  finalShareAmount: number;
}

/**
 * Complete calculation preview for one utility bill.
 */
export interface UtilityBillShareResult {
  utilityType: UtilityType;
  unit: UtilityUnit;

  /**
   * Actual amount payable to the utility provider.
   */
  totalBillAmount: number;

  /**
   * Effective utility rate used in share calculations.
   *
   * Electricity uses the manually entered provider rate.
   * Water derives this from total bill amount divided by
   * total provider-billed consumption.
   */
  ratePerUnit: number;

  /**
   * Sum of all member submeter consumption.
   */
  totalSubmeterConsumption: number;

  /**
   * Sum of all assigned appliance consumption.
   */
  totalApplianceConsumption: number;

  /**
   * Sum of all member submeter charges.
   */
  totalSubmeterChargeAmount: number;

  /**
   * Sum of all appliance usage charges.
   */
  totalApplianceChargeAmount: number;

  /**
   * Sum of all fixed compensation amounts.
   */
  totalFixedCompensationAmount: number;

  /**
   * Sum of all direct member usage amounts.
   *
   * This includes submeter charges, appliance charges,
   * and fixed compensation amounts.
   */
  totalDirectUsageAmount: number;

  /**
   * Bill amount remaining after all direct member usage
   * amounts have been deducted.
   */
  sharedRemainderAmount: number;

  /**
   * Number of members participating in the equal division
   * of the shared remainder.
   */
  equalShareMemberCount: number;

  /**
   * Mathematical average of the shared remainder.
   *
   * Individual member amounts may differ by one cent when
   * cent reconciliation is required.
   */
  equalShareAmountPerMember: number;

  memberShares: UtilityMemberShareResult[];

  /**
   * Sum of all final member shares.
   */
  totalMemberShares: number;

  /**
   * Difference between the provider bill and all final
   * member shares.
   */
  validationDifference: number;

  /**
   * True only when all final member shares equal the
   * provider bill at cent-level precision.
   */
  isBalanced: boolean;
}
