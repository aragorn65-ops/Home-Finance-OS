import "./Header.css";

import TimeContext from "../../shared/ui/TimeContext";

import {
  Search,
  Bell,
  CircleUserRound,
} from "lucide-react";

export default function Header() {
  return (
    <header className="app-header">

      <TimeContext />

      <div className="header-actions">

        <Search size={19} />

        <Bell size={19} />

        <CircleUserRound size={24} />

      </div>

    </header>
  );
}