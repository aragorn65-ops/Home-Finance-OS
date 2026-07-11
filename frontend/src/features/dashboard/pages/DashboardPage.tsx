import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome to HFOS"
      />

      <Card>
        <h2>Coming Soon</h2>

        <p>
          Your household dashboard will appear here.
        </p>
      </Card>
    </>
  );
}