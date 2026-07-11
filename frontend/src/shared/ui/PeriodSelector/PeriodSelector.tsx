import "./PeriodSelector.css";

import { ChevronDown, Calendar } from "lucide-react";

export default function PeriodSelector() {
  return (
    <button className="period-selector">

      <Calendar size={18} />

      <span>April 2026</span>

      <ChevronDown size={16} />

    </button>
  );
}