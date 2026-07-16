import PageHeader from "../../../shared/ui/PageHeader";

import HouseholdMemberManager from "../components/HouseholdMemberManager";

export default function HouseholdMembersPage() {
  return (
    <>
      <PageHeader
        title="Household Members"
        subtitle="Manage members who participate in shared expenses and settlements."
      />

      <HouseholdMemberManager />
    </>
  );
}