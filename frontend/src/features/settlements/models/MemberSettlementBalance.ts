import type { HouseholdMember } from "../../household/models/HouseholdMember";

export type MemberSettlementPosition =
  | "creditor"
  | "debtor"
  | "settled";

export interface MemberSettlementBalance {
  memberId: HouseholdMember["id"];

  /**
   * Outstanding amount other household members
   * must reimburse to this member.
   */
  amountToReceive: number;

  /**
   * Outstanding amount this member must reimburse
   * to other household members.
   */
  amountToPay: number;

  /**
   * Amount To Receive - Amount To Pay
   *
   * Positive means the member should receive money.
   * Negative means the member owes money.
   * Zero means the member is settled.
   */
  netPosition: number;

  /**
   * Derived from the member's net position.
   */
  position: MemberSettlementPosition;
}