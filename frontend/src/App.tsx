import AppLayout from "./shared/layout/AppLayout";
import Header from "./shared/layout/Header";
import Sidebar from "./shared/navigation/Sidebar";

import GovernancePage from "./features/governance/pages/GovernancePage";

export default function App() {
  return (
    <AppLayout
      sidebar={<Sidebar />}
      header={<Header />}
    >
      <GovernancePage />
    </AppLayout>
  );
}