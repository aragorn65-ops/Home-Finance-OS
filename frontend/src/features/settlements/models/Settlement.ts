import type { Account } from "../../accounts/models/Account";
import type { HouseholdMember } from "../../household/models/HouseholdMember";
import type { StoredAttachment } from "../../../shared/models/StoredAttachment";

export type SettlementApplicationMethod =
  | "oldest-first"
  | "manual";

export interface Settlement {
  id: string;
  householdId: string;

  /**
   * Member paying an outstanding obligation.
   */
  fromMemberId: HouseholdMember["id"];

  /**
   * Member receiving repayment for expenses
   * they previously paid.
   */
  toMemberId: HouseholdMember["id"];

  amount: number;
  settlementDate: Date;

  /**
   * Optional financial accounts involved
   * in the settlement payment.
   *
   * Private account information must remain
   * visible only to authorized members.
   */
  sourceAccountId?: Account["id"];
  destinationAccountId?: Account["id"];

  applicationMethod: SettlementApplicationMethod;

  referenceNumber?: string;
  notes?: string;

  /**
   * Locally stored transfer receipts or proof of payment.
   */
  attachments: StoredAttachment[];

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
