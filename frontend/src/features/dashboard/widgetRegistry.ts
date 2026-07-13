import HouseholdSummary from "./widgets/HouseholdSummary";
import NetWorth from "./widgets/NetWorth";
import CashFlowWidget from "./widgets/cash-flow/CashFlowWidget";
import DashboardSummary from "./widgets/dashboard-summary/DashboardSummary";

import type { DashboardWidget } from "./models/DashboardWidget";

export const dashboardWidgets: DashboardWidget[] = [
  {
    id: "dashboard-summary",
    title: "Dashboard Summary",
    component: DashboardSummary,
    order: 1,
    size: "medium",
    enabled: true,
  },
  {
    id: "household-summary",
    title: "Household Summary",
    component: HouseholdSummary,
    order: 2,
    size: "medium",
    enabled: true,
  },
  {
    id: "net-worth",
    title: "Net Worth",
    component: NetWorth,
    order: 3,
    size: "small",
    enabled: true,
  },
  {
    id: "cash-flow",
    title: "Cash Flow",
    component: CashFlowWidget,
    order: 4,
    size: "medium",
    enabled: true,
  },
];