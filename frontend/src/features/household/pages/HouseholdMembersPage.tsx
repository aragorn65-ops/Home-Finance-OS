import PageHeader from "../../../shared/ui/PageHeader";

import HouseholdMemberManager from "../components/HouseholdMemberManager";
import {
  isAuthFeatureEnabled,
} from "../../../config/auth";
import {
  useHouseholdMembership,
} from "../../auth";
import {
  loadHousehold,
} from "../services/householdStorage";

export default function HouseholdMembersPage() {
  const household = loadHousehold();
  const authHouseholdId =
    household?.authenticatedLink
      ?.remoteHouseholdId ??
    household?.id ??
    "";
  const {
    membership,
  } = useHouseholdMembership(
    authHouseholdId
  );
  const canManageMembers =
    !isAuthFeatureEnabled() ||
    membership?.role === "owner" ||
    membership?.role === "admin";

  return (
    <>
      <PageHeader
        title="Household Members"
        subtitle={
          canManageMembers
            ? "Manage members who participate in shared expenses and settlements."
            : "View members who participate in shared expenses and settlements."
        }
      />

      <HouseholdMemberManager
        isReadOnly={!canManageMembers}
      />
    </>
  );
}
