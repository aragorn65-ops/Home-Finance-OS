import "./Header.css";

import {
  Bell,
  CircleUserRound,
  Menu,
  Search,
} from "lucide-react";

interface HeaderProps {
  isMenuOpen?: boolean;
  onMenuToggle?: () => void;
}

export default function Header({
  isMenuOpen = false,
  onMenuToggle,
}: HeaderProps) {
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

        <button
          type="button"
          className="app-header__action-button"
          aria-label="User profile"
          title="User profiles are not available yet"
        >
          <CircleUserRound
            size={24}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
