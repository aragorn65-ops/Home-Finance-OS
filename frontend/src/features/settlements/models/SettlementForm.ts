import type {
  SettlementApplicationMethod,
} from "./Settlement";

import type {
  SettlementApplicationForm,
} from "./SettlementApplicationForm";

export interface SettlementForm {
  householdId: string;

  /**
   * Member paying the outstanding obligation.
   */
  fromMemberId: string;

  /**
   * Member receiving the reimbursement.
   */
  toMemberId: string;

  amount: number;
  settlementDate: string;

  /**
   * Optional financial accounts used
   * for the member-to-member payment.
   */
  sourceAccountId: string;
  destinationAccountId: string;

  applicationMethod: SettlementApplicationMethod;

  /**
   * Manual allocation selections.
   *
   * Oldest-first settlements may leave this empty
   * because applications are calculated automatically.
   */
  applications: SettlementApplicationForm[];

  referenceNumber: string;
  notes: string;

  isActive: boolean;
}

export const defaultSettlementForm: SettlementForm = {
  householdId: "",

  fromMemberId: "",
  toMemberId: "",

  amount: 0,
  settlementDate: "",

  sourceAccountId: "",
  destinationAccountId: "",

  applicationMethod: "oldest-first",
  applications: [],

  referenceNumber: "",
  notes: "",

  isActive: true,
};