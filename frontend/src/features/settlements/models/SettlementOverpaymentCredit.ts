import type { Settlement } from "./Settlement";

export interface SettlementOverpaymentCredit {
  settlementId: Settlement["id"];
  householdId: Settlement["householdId"];
  creditMemberId: Settlement["fromMemberId"];
  counterpartyMemberId: Settlement["toMemberId"];
  amount: number;
  settlementDate: Date;
}

