import type {
  SettlementApplicationMethod,
} from "../../settlements/models/Settlement";
import type {
  StoredAttachment,
} from "../../../shared/models/StoredAttachment";

export interface RemoteSettlement {
  id: string;
  householdId: string;
  localRecordId?: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  settlementDate: Date;
  sourceAccountId?: string;
  destinationAccountId?: string;
  applicationMethod: SettlementApplicationMethod;
  referenceNumber?: string;
  notes?: string;
  attachments: StoredAttachment[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedByUserId?: string;
}

export interface RemoteSettlementApplication {
  id: string;
  householdId: string;
  localRecordId?: string;
  settlementId: string;
  expenseAllocationId: string;
  appliedAmount: number;
  createdAt: Date;
  updatedAt: Date;
  updatedByUserId?: string;
}

export interface RemoteSettlementDraft {
  householdId: string;
  localRecordId?: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  settlementDate: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  applicationMethod: SettlementApplicationMethod;
  referenceNumber?: string;
  notes?: string;
  attachments?: StoredAttachment[];
  isActive: boolean;
}

export interface RemoteSettlementApplicationDraft {
  localRecordId?: string;
  expenseAllocationId: string;
  appliedAmount: number;
}

export interface RemoteSettlementCreateInput {
  settlement: RemoteSettlementDraft;
  applications?: RemoteSettlementApplicationDraft[];
}

export interface RemoteSettlementUpdateInput {
  settlementId: string;
  settlement: RemoteSettlementDraft;
  applications?: RemoteSettlementApplicationDraft[];
}

export interface RemoteSettlementMutationResult {
  settlement: RemoteSettlement;
  applications: RemoteSettlementApplication[];
}
