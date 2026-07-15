import "./AppShell.css";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";

import {
  loadHousehold,
} from "../../features/household/services/householdStorage";

export default function AppShell() {
  const household = loadHousehold();

  if (!household) {
    return (
      <Navigate
        to="/household"
        replace
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Header />

        <main className="app-content">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}