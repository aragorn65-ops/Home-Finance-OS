import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "../AppShell";

import { StartupPage } from "../../features/startup";
import { HouseholdPage } from "../../features/household";

import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import GovernancePage from "../../features/governance/pages/GovernancePage";
import SettingsPage from "../../features/settings/pages/SettingsPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Startup */}
        <Route
          path="/"
          element={<StartupPage />}
        />

        {/* Household Setup */}
        <Route
          path="/household"
          element={<HouseholdPage />}
        />

        {/* Main Application */}
        <Route
          path="/app"
          element={<AppShell />}
        >
          <Route
            index
            element={<DashboardPage />}
          />

          <Route
            path="help-center"
            element={<GovernancePage />}
          />

          <Route
            path="settings"
            element={<SettingsPage />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}