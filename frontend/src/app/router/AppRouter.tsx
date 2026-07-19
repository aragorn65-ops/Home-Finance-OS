import {
  Suspense,
  lazy,
} from "react";

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

const AccountHolderPage = lazy(
  () =>
    import(
      "../../features/account-holder/pages/AccountHolderPage"
    )
);

const AccountsPage = lazy(
  () =>
    import(
      "../../features/accounts/pages/AccountsPage"
    )
);

const AnalyticsPage = lazy(
  () =>
    import(
      "../../features/analytics/pages/AnalyticsPage"
    )
);

const DashboardPage = lazy(
  () =>
    import(
      "../../features/dashboard/pages/DashboardPage"
    )
);

const GovernancePage = lazy(
  () =>
    import(
      "../../features/governance/pages/GovernancePage"
    )
);

const HouseholdMembersPage = lazy(
  () =>
    import(
      "../../features/household/pages/HouseholdMembersPage"
    )
);

const ReportsPage = lazy(
  () =>
    import(
      "../../features/reports/pages/ReportsPage"
    )
);

const SavingsPage = lazy(
  () =>
    import(
      "../../features/savings/pages/SavingsPage"
    )
);

const SettingsPage = lazy(
  () =>
    import(
      "../../features/settings/pages/SettingsPage"
    )
);

const SettlementsPage = lazy(
  () =>
    import(
      "../../features/settlements/pages/SettlementsPage"
    )
);

const TransactionsPage = lazy(
  () =>
    import(
      "../../features/transactions/pages/TransactionsPage"
    )
);

const UtilitiesPage = lazy(
  () =>
    import(
      "../../features/utilities/pages/UtilitiesPage"
    )
);

function RouteFallback() {
  return (
    <div
      role="status"
      className="px-6 py-8 text-sm text-muted-foreground"
    >
      Loading...
    </div>
  );
}

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
            element={
              <Suspense fallback={<RouteFallback />}>
                <DashboardPage />
              </Suspense>
            }
          />

          <Route
            path="accounts"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AccountsPage />
              </Suspense>
            }
          />

          <Route
            path="transactions"
            element={
              <Suspense fallback={<RouteFallback />}>
                <TransactionsPage />
              </Suspense>
            }
          />

          <Route
            path="utilities"
            element={
              <Suspense fallback={<RouteFallback />}>
                <UtilitiesPage />
              </Suspense>
            }
          />

          <Route
            path="settlements"
            element={
              <Suspense fallback={<RouteFallback />}>
                <SettlementsPage />
              </Suspense>
            }
          />

          <Route
            path="savings"
            element={
              <Suspense fallback={<RouteFallback />}>
                <SavingsPage />
              </Suspense>
            }
          />

          <Route
            path="analytics"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AnalyticsPage />
              </Suspense>
            }
          />

          <Route
            path="account-holder"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AccountHolderPage />
              </Suspense>
            }
          />

          <Route
            path="reports"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ReportsPage />
              </Suspense>
            }
          />

          <Route
            path="household-members"
            element={
              <Suspense fallback={<RouteFallback />}>
                <HouseholdMembersPage />
              </Suspense>
            }
          />

          <Route
            path="help-center"
            element={
              <Suspense fallback={<RouteFallback />}>
                <GovernancePage />
              </Suspense>
            }
          />

          <Route
            path="settings"
            element={
              <Suspense fallback={<RouteFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
