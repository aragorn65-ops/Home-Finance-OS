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
import AccountHolderPage from "../../features/account-holder/pages/AccountHolderPage";
import AnalyticsPage from "../../features/analytics/pages/AnalyticsPage";
import DashboardPage from "../../features/dashboard/pages/DashboardPage";
import GovernancePage from "../../features/governance/pages/GovernancePage";
import HouseholdMembersPage from "../../features/household/pages/HouseholdMembersPage";
import ReportsPage from "../../features/reports/pages/ReportsPage";
import SavingsPage from "../../features/savings/pages/SavingsPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import SettlementsPage from "../../features/settlements/pages/SettlementsPage";
import TransactionsPage from "../../features/transactions/pages/TransactionsPage";
import UtilitiesPage from "../../features/utilities/pages/UtilitiesPage";

export default function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            path="utilities"
            element={<UtilitiesPage />}
          />

          <Route
            path="settlements"
            element={<SettlementsPage />}
          />

          <Route
            path="savings"
            element={<SavingsPage />}
          />

          <Route
            path="analytics"
            element={<AnalyticsPage />}
          />

          <Route
            path="account-holder"
            element={<AccountHolderPage />}
          />

          <Route
            path="reports"
            element={<ReportsPage />}
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
