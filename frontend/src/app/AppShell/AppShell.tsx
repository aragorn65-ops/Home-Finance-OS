import "./AppShell.css";

import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";

import {
  loadHousehold,
} from "../../features/household/services/householdStorage";
import AppUnlockScreen from "../../features/security/components/AppUnlockScreen";
import {
  isAppLockEnabled,
} from "../../features/security/services/appLockService";

export default function AppShell() {
  const household = loadHousehold();
  const location = useLocation();

  const [
    isLockEnabled,
    setIsLockEnabled,
  ] = useState(() =>
    isAppLockEnabled()
  );

  const [
    isLocked,
    setIsLocked,
  ] = useState(() =>
    isAppLockEnabled()
  );

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  useEffect(() => {
    const handleAppLockSettingsChanged =
      () => {
        const nextIsEnabled =
          isAppLockEnabled();

        setIsLockEnabled(
          nextIsEnabled
        );

        if (!nextIsEnabled) {
          setIsLocked(false);
        }
      };

    window.addEventListener(
      "hfos-app-lock-settings-changed",
      handleAppLockSettingsChanged
    );

    return () => {
      window.removeEventListener(
        "hfos-app-lock-settings-changed",
        handleAppLockSettingsChanged
      );
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isSidebarOpen]);

  if (!household) {
    return (
      <Navigate
        to="/household"
        replace
      />
    );
  }

  if (
    isLockEnabled &&
    isLocked
  ) {
    return (
      <AppUnlockScreen
        householdName={
          household.householdName
        }
        onUnlock={() =>
          setIsLocked(false)
        }
      />
    );
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((current) => !current);
  };

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="app-main">
        <Header
          isMenuOpen={isSidebarOpen}
          onMenuToggle={toggleSidebar}
          onLock={
            isLockEnabled
              ? () => {
                  setIsSidebarOpen(false);
                  setIsLocked(true);
                }
              : undefined
          }
        />

        <main className="app-content">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
