import type { HouseholdMember } from "../../household/models/HouseholdMember";

export interface MemberSettlementObligation {
  /**
   * Member who owes the outstanding amount.
   */
  fromMemberId: HouseholdMember["id"];

  /**
   * Member who paid the original expenses
   * and should receive reimbursement.
   */
  toMemberId: HouseholdMember["id"];

  /**
   * Total outstanding amount owed between
   * these two household members.
   */
  amount: number;

  /**
   * Number of unpaid or partially paid allocations
   * contributing to this obligation.
   */
  allocationCount: number;
}