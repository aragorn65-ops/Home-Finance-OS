import PageHeader from "../../../shared/ui/PageHeader";

import DashboardGrid from "../components/DashboardGrid";
import { dashboardWidgets } from "../widgetRegistry";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your household financial workspace."
      />

      <DashboardGrid>
        {dashboardWidgets.map(({ id, component: Component }) => (
          <Component key={id} />
       ))}
      </DashboardGrid>
    </>
  );
}