import "./Header.css";

import {
  Bell,
  LockKeyhole,
  Menu,
  Search,
} from "lucide-react";

import {
  AuthSessionButton,
  useAuthSession,
} from "../../features/auth";
import {
  isAuthFeatureEnabled,
} from "../../config/auth";

interface HeaderProps {
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
  onLock?: () => void;
}

export default function Header({
  isMenuOpen = false,
  onMenuToggle,
  onLock,
}: HeaderProps) {
  const authSession =
    useAuthSession();
  const showAuthSession =
    isAuthFeatureEnabled();

  return (
    <header className="app-header">
      <div className="app-header__leading">
        <button
          type="button"
          className="app-header__menu-button"
          aria-label={
            isMenuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-controls="app-sidebar"
          aria-expanded={isMenuOpen}
          onClick={onMenuToggle}
        >
          <Menu
            size={20}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        className="app-header__actions"
        aria-label="Application actions"
      >
        <button
          type="button"
          className="app-header__action-button"
          aria-label="Search"
          title="Search is not available yet"
        >
          <Search
            size={19}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="app-header__action-button"
          aria-label="Notifications"
          title="Notifications are not available yet"
        >
          <Bell
            size={19}
            aria-hidden="true"
          />
        </button>

        {onLock && (
          <button
            type="button"
            className="app-header__action-button"
            aria-label="Lock HFOS"
            title="Lock HFOS"
            onClick={onLock}
          >
            <LockKeyhole
              size={19}
              aria-hidden="true"
            />
          </button>
        )}

        {showAuthSession && (
          <AuthSessionButton
            session={
              authSession.session
            }
            error={authSession.error}
            onSignIn={
              authSession.signIn
            }
            onSignOut={
              authSession.signOut
            }
          />
        )}
      </div>
    </header>
  );
}
