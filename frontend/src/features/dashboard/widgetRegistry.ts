import HouseholdSummary from "./widgets/HouseholdSummary";
import NetWorth from "./widgets/NetWorth";
import CashFlowWidget from "./widgets/cash-flow/CashFlowWidget";
import type { DashboardWidget } from "./models/DashboardWidget";


export const dashboardWidgets: DashboardWidget[] = [
  {
    id: "household-summary",
    title: "Household Summary",
    component: HouseholdSummary,
    order: 1,
    size: "medium",
    enabled: true,
  },
  {
    id: "net-worth",
    title: "Net Worth",
    component: NetWorth,
    order: 2,
    size: "small",
    enabled: true,
  },
  {
    id: "cash-flow",
    title: "Cash Flow",
    component: CashFlowWidget,
    order: 3,
    size: "medium",
    enabled: true,
  },
];