import "./TimeContext.css";

import { CalendarDays, ChevronDown } from "lucide-react";

export default function TimeContext() {
  return (
    <button className="time-context">

      <CalendarDays size={18} />

      <span>April 2026</span>

      <ChevronDown size={16} />

    </button>
  );
}
