import { useNavigate } from "react-router-dom";

import PageHeader from "../../../shared/ui/PageHeader";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your household financial workspace."
      />

      <Card>
        <h2>Welcome Home</h2>

        <p>
          Complete your household setup to unlock your financial dashboard.
        </p>

        <Button
          onClick={() => navigate("/household")}
        >
          Set Up Household →
        </Button>
      </Card>
    </>
  );
}