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
  getAppLockIdleTimeoutMinutes,
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
    idleTimeoutMinutes,
    setIdleTimeoutMinutes,
  ] = useState(() =>
    getAppLockIdleTimeoutMinutes()
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
        setIdleTimeoutMinutes(
          getAppLockIdleTimeoutMinutes()
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
    if (
      !isLockEnabled ||
      isLocked ||
      idleTimeoutMinutes <= 0
    ) {
      return;
    }

    let timeoutId:
      ReturnType<typeof setTimeout>;

    const lockAfterInactivity = () => {
      setIsSidebarOpen(false);
      setIsLocked(true);
    };

    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(
        lockAfterInactivity,
        idleTimeoutMinutes * 60 * 1000
      );
    };

    const activityEvents = [
      "click",
      "keydown",
      "pointerdown",
      "scroll",
      "touchstart",
    ] as const;

    activityEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        resetTimer,
        {
          passive: true,
        }
      );
    });

    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);

      activityEvents.forEach((eventName) => {
        window.removeEventListener(
          eventName,
          resetTimer
        );
      });
    };
  }, [
    idleTimeoutMinutes,
    isLockEnabled,
    isLocked,
  ]);

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
