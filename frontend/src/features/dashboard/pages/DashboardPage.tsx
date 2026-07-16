import PageHeader from "../../../shared/ui/PageHeader";

import DashboardGrid from "../components/DashboardGrid";
import DashboardLayoutService from "../services/DashboardLayoutService";

export default function DashboardPage() {
  const widgets = DashboardLayoutService.getWidgets();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your household financial workspace."
      />

      <DashboardGrid>
        {widgets.map(({ id, component: Component }) => (
          <Component key={id} />
        ))}
      </DashboardGrid>
    </>
  );
}