export type RemoteRecordVisibility =
  | "household"
  | "private";

export interface RemoteTenantRecord {
  id: string;
  householdId: string;
  visibility?: RemoteRecordVisibility;
  ownerMemberId?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedByUserId?: string;
  deletedAt?: Date;
  revision?: number;
}
