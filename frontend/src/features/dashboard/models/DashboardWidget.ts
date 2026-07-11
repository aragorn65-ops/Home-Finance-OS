import type { ComponentType } from "react";

export type DashboardWidgetSize =
  | "small"
  | "medium"
  | "large";

export interface DashboardWidget {
  id: string;
  title: string;
  component: ComponentType;
  order: number;
  size: DashboardWidgetSize;
  enabled: boolean;
}