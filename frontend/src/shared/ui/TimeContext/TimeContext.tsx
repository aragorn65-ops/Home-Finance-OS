import "./TimeContext.css";

import { CalendarDays } from "lucide-react";

export default function TimeContext() {
  return (
    <div
      className="time-context"
      aria-label="Current reporting period: April 2026"
    >
      <CalendarDays
        className="time-context__icon"
        size={18}
        aria-hidden="true"
      />

      <span className="time-context__label">
        April 2026
      </span>
    </div>
  );
}
