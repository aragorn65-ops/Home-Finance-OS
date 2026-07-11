import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "../AppShell";

import GovernancePage from "../../features/governance/pages/GovernancePage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route
            path="/"
            element={<DashboardPage />}
          />

          <Route
            path="/knowledge-center"
            element={<GovernancePage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}