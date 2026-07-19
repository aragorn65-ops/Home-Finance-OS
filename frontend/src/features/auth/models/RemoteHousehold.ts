import type {
  HouseholdMember,
} from "../../household/models/HouseholdMember";

export type RemoteHouseholdStatus =
  | "active"
  | "archived"
  | "deleted";

export interface RemoteHousehold {
  id: string;
  name: string;
  ownerMemberId: HouseholdMember["id"];
  status: RemoteHouseholdStatus;
  createdAt: Date;
  updatedAt: Date;
}
