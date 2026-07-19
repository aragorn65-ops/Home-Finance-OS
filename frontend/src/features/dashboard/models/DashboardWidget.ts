import type { ComponentType } from "react";

export type DashboardWidgetSize =
  | "small"
  | "medium"
  | "large";

export interface DashboardWidgetProps {
  selectedMonth: Date;
}

export interface DashboardWidget {
  id: string;
  title: string;
  component: ComponentType<
    DashboardWidgetProps
  >;
  order: number;
  size: DashboardWidgetSize;
  enabled: boolean;
}
