import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AppShell from "../AppShell";

import {
  StartupPage,
} from "../../features/startup";

import {
  HouseholdPage,
} from "../../features/household";

import AccountsPage from "../../features/accounts/pages/AccountsPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import GovernancePage from "../../features/governance/pages/GovernancePage";
import HouseholdMembersPage from "../../features/household/pages/HouseholdMembersPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import TransactionsPage from "../../features/transactions/pages/TransactionsPage";

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
            path="accounts"
            element={<AccountsPage />}
          />

          <Route
            path="transactions"
            element={<TransactionsPage />}
          />

          <Route
            path="household-members"
            element={
              <HouseholdMembersPage />
            }
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