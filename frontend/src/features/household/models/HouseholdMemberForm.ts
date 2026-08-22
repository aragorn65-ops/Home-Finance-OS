import type {
  HouseholdMemberRole,
} from "./HouseholdMember";

export interface HouseholdMemberForm {
  displayName: string;
  email?: string;
  role: HouseholdMemberRole;
  color: string;
  isActive: boolean;
}

export const defaultHouseholdMemberForm:
  HouseholdMemberForm = {
    displayName: "",
    role: "member",
    color: "",
    isActive: true,
  };
