import "./AppShell.css";
import type { ReactNode } from "react";

import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">

      <Sidebar />

      <div className="app-main">

        <Header />

        <main className="app-content">

          {children}

        </main>

      </div>

    </div>
  );
}